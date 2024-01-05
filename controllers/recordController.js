const db = require('../models');
const Records = db.record;
const path = require('path');
const fs = require('fs');
const csv = require('fast-csv');
const logger = require('../utils/logger');
const { validHeader, validateRow, ALLOWED_CSV_HEADERS } = require('../utils/validateCsv');
const { Op } = require('sequelize');

// Get Methods
// Get all records
// TODO change to async await
exports.getAllRecords = async (req, res) => {
    await Records.findAll({
        attributes: {
            exclude: ['createdAt', 'updatedAt'],
        },
    })
        .then((data) => {
            if (data) {
                return res.status(200).json(data);
            } else {
                return res.sendStatus(204); // Database empty
            }
        })
        .catch((err) => {
            logger.log('error', `[getAllRecords] - ${err.message}`);
            return res.status(500).json({ message: err.message });
        });
}; // End getAllRecords function

// Get some records
// This function will be used for pagenation to speed up the loading of tracks
// TODO: Add in some validation for offset and limit to ensure valid values
exports.getSomeRecords = async (req, res) => {
    const { offset, limit } = req.params;

    try {
        // todo: Need to make sure it is counting all records in database
        // todo: not just records that are being returned
        const response = await Records.findAndCountAll({
            offset: offset,
            limit: limit,
            attributes: {
                exclude: ['createdAt', 'updatedAt'],
            },
        });

        if (response.count === 0) return res.sendStatus(204); // Database empty
        return res.status(200).json(response); // Should have count and rows
    } catch (err) {
        logger.log('error', `[getSomeRecords] - ${err.message}`);
        return res.status(500).json({ message: err.message });
    }

    /*
    await Records.findAll({
        offset: offset,
        limit: limit,
        attributes: {
            exclude: ['createdAt', 'updatedAt'],
        },
    })
        .then((data) => {
            if (data) {
                return res.status(200).json(data);
            } else {
                return res.sendStatus(204); // Database empty
            }
        })
        .catch((err) => {
            logger.log('error', `[getAllRecords] - ${err.message}`);
            return res.status(500).json({ message: err.message });
        });
        */
}; // End getSomeRecords function

// Get some records by search terms
// This function will also be used for pagenation to speed up the loading of tracks
// TODO: Add in some validation for offset and limit to ensure valid values
// TODO: Also add in validation for search terms that are submitted
// todo - This should be done on the front in, but jic
exports.searchSomeRecords = async (req, res) => {
    const { offset, limit } = req.params;

    //console.log(req.body);

    const { searchTerms } = req.body;
    //console.log(`searchTerms: ${searchTerms}`);

    // This should create an array of objects in the proper search format
    // For sequelize
    const searchData = searchTerms.map((s) => {
        return { [s.column]: s.value };
    });

    try {
        const response = await Records.findAndCountAll({
            offset: offset,
            limit: limit,
            // Using computed property names with []
            where: sequelize.where(sequelize.fn('lower', searchData)),
            attributes: {
                exclude: ['createdAt', 'updatedAt'],
            },
        });

        if (response.count === 0) return res.sendStatus(204); // No Results
        return res.status(200).json(response); // Should have count and rows
    } catch (err) {
        logger.log('error', `[searchSomeRecords] - ${err.message}`);
        return res.status(500).json({ message: err.message });
    }
}; // End searchSomeRecords function

// Get one record by :id
exports.getRecord = async (req, res) => {
    const { id } = req.params;

    try {
        const foundRecord = await Records.findOne({ where: { rid: id } });
        if (!foundRecord) {
            logger.log('info', `[getRecord] - No RECORD found with ID: [${id}]`);
            return res.sendStatus(404);
        }
        return res.status(200).json(foundRecord);
    } catch (err) {
        logger.error('error', `[getRecord] - ${err.message}`);
        return res.status(500).json({ message: err.message });
    }
}; // End getRecord function

// Post Methods
// Create several records from a csv file
// TODO Should there be an await somewhere in here if it's async??
exports.createMultipleRecords = async (req, res) => {
    try {
        const user_roles = req.roles;
        const user_name = req.user;

        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({ message: 'No files were uploaded.', reason: 'empty' });
        }

        const newFile = req.files.newFile;
        const storedFilename = `${Date.now()}-omicsbase-${newFile.name}`;
        const uploadPath = './assets/uploads/' + storedFilename;

        if (false) {
            // Temporarily removing file type checking as it wasn't catching every possible mime type
            // if (newFile.mimetype !== 'text/csv' && newFile.mimetype !== 'text/plain' && newFile.mimetype !== 'application/vnd.ms-excel') {
            //     logger.log('info', `[createMultipleRecords] - USER: [${user_name}] attempted to upload a non-csv file`);
            //     logger.log('info', `File Info: ${newFile.name} - ${newFile.mimetype}`);
            //     return res.status(400).json({
            //         message: 'File received was not a CSV file.',
            //         reason: 'file-type',
            //     });
        } else {
            let bad_headers = [];
            let bad_rows = [];
            let bad_row_numbers = [];
            let tracks = [];
            await newFile.mv(uploadPath);

            fs.createReadStream(uploadPath)
                .pipe(csv.parse({ headers: true, trim: true, ignoreEmpty: true }))
                .on('error', (error) => {
                    logger.log('error', `[createMultipleRecords] - CSV Upload Error: ${error}`);
                    return res.status(400).json({ message: error.message });
                })
                .on('headers', (headers) => {
                    headers.map((header) => {
                        if (!validHeader(header)) bad_headers.push(header);
                    });
                })
                .validate((data) => validateRow(data, user_roles))
                .on('data', (row) => {
                    // Add the submitting username to the record row
                    row['submitted_by'] = user_name;
                    // Cast the numeric strings to numbers after stripping '%' out
                    row['total_mapped'] = parseFloat(row['total_mapped'].replace('%', ''));
                    row['percent_aligned'] = parseFloat(row['percent_aligned'].replace('%', ''));
                    row['percent_uniquely_mapped'] = parseFloat(row['percent_uniquely_mapped'].replace('%', ''));
                    tracks.push(row);
                })
                .on('data-invalid', (row, rowNumber) => {
                    bad_rows.push(row);
                    bad_row_numbers.push(rowNumber);
                })
                // TODO: Refactor return statements to just edit the message and have a single return at the end?
                .on('end', (rowCount) => {
                    // I don't think we need to log when a user tries to upload a CSV file that doesn't have the right headers, etc
                    if (bad_headers.length && !bad_rows.length) {
                        return res.status(400).json({
                            message: 'The column headers for the file submitted are not valid',
                            badHeaders: bad_headers,
                            reason: 'headers',
                        });
                    } else if (bad_rows.length && !bad_headers.length) {
                        return res.status(400).json({
                            message: 'One or more rows in the submitted csv file did not pass validation.',
                            badRowNumbers: bad_row_numbers,
                            reason: 'rows',
                        });
                    } else if (bad_headers.length && bad_rows.length) {
                        return res.status(400).json({
                            message: 'One or more column headers and one or more rows did not pass validation',
                            badHeaders: bad_headers,
                            badRowNumbers: bad_row_numbers,
                            reason: 'headers-and-rows',
                        });
                    } else {
                        Records.bulkCreate(tracks)
                            .then(() => {
                                const successMessage =
                                    rowCount === 1
                                        ? `${rowCount} row added to the database successfully`
                                        : `${rowCount} rows added to the database successfully`;
                                logger.log('info', `[createMultipleRecords] - ${successMessage} by USER: [${user_name}]`);
                                return res.status(201).json({ message: successMessage });
                            })
                            .catch((err) => {
                                logger.log('error', `[createMultipleRecords] - ${err.msg}`);
                                res.status(500).json({
                                    message: err.message,
                                });
                            });
                    }
                });

            // Delete the uploaded file, as it is no longer needed
            // fs.unlink(uploadPath, (err) => {
            //     if (err) {
            //         logger.log('error', `[createMultipleRecords] - Upload Deletion Error - ${err.message}`);
            //         throw err;
            //     }
            //     logger.log('info', `[createMultipleRecords] - ${storedFilename} deleted successfully.`);
            // });
        }
    } catch (err) {
        logger.log('error', `[createMultipleRecords] - ${err.message}`);
        res.status(500).send({
            message: 'Could not upload the file: ' + newFile.name,
        });
    }
}; // End createMultipleRecords function

// Alternate bulk create with decoupled CSV header and body validation
exports.createRecords = async (req, res) => {
    const user_roles = req.roles;
    const user_name = req.user;

    if (!user_roles || !user_name) {
        return res.sendStatus(401);
    }

    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ message: 'No files were uploaded.', reason: 'empty' });
    }

    const newFile = req.files.newFile;
    if (path.extname(newFile.name).toLowerCase() !== '.csv') {
        logger.log('info', `[createMultipleRecords] - USER: [${user_name}] attempted to upload a non-csv file`);
        return res.status(400).json({ message: 'File does not have csv extension.', reason: 'file-type' });
    }

    const storedFilename = `${Date.now()}-omicsbase-${newFile.name}`;
    const uploadPath = './assets/uploads/' + storedFilename;

    // Parse first line of file and ensure that headers are valid before proceeding to full processing
    try {
        let bad_headers = [];

        await newFile.mv(uploadPath);

        fs.createReadStream(uploadPath)
            .pipe(csv.parse({ headers: true, trim: true, ignoreEmpty: true }))
            .on('error', (error) => {
                logger.log('error', `[createRecords] - CSV Upload Error - Header try block: ${error}`);
                return res.status(400).json({ message: error.message });
            })
            .on('headers', (headers) => {
                headers.map((header) => {
                    if (!validHeader(header)) bad_headers.push(header);
                });
            })
            .on('end', () => {
                if (bad_headers.length) {
                    return res.status(400).json({ message: 'Headers invalid' });
                }
            });
    } catch (err) {
        return res.status(500).json({ message: err.message, location: 'header try block' });
    }

    // If we've made it to this point, the headers are fine...move on to full validation
    try {
        let bad_rows = [];
        let bad_row_numbers = [];
        let tracks = [];

        const file_handle = fs.createReadStream(uploadPath);
        file_handle
            .pipe(
                csv.parse({
                    headers: (headers) => headers.map((h) => h.toLowerCase()),
                    trim: true,
                    ignoreEmpty: true,
                })
            )
            .on('error', (err) => {
                logger.log('error', `[createRecords] - CSV Upload Error - Parsing try block: ${err}`);
                return res.status(400).json({ message: err.message });
            })
            .validate((data) => validateRow(data, user_roles))
            .on('data', (row) => {
                // Add the submitting username to the record row
                row['submitted_by'] = user_name;

                // Cast the numeric strings to numbers after stripping '%' out assuming anything exists in those fields
                // Add in optional chaining to make sure these exist
                row['total_mapped'] = row['total_mapped']?.length ? parseFloat(row['total_mapped'].replace('%', '')) : null;

                row['percent_aligned'] = row['percent_aligned']?.length ? parseFloat(row['percent_aligned'].replace('%', '')) : null;

                row['percent_uniquely_mapped'] = row['percent_uniquely_mapped']?.length ? parseFloat(row['percent_uniquely_mapped'].replace('%', '')) : null;

                row['unmapped_reads'] = row['unmapped_reads']?.length ? parseInt(row['unmapped_reads']) : null;

                row['splice_reads'] = row['splice_reads']?.length ? parseInt(row['splice_reads']) : null;

                row['non_splice_reads'] = row['non_splice_reads']?.length ? parseInt(row['non_splice_reads']) : null;

                row['reads_mapped_to_plus'] = row['reads_mapped_to_plus']?.length ? parseInt(row['reads_mapped_to_plus']) : null;

                row['reads_mapped_to_minus'] = row['reads_mapped_to_minus']?.length ? parseInt(row['reads_mapped_to_minus']) : null;

                tracks.push(row);
            })
            .on('data-invalid', (row, rowNumber) => {
                bad_rows.push(row);
                bad_row_numbers.push(rowNumber);
            })
            .on('end', (rowCount) => {
                file_handle.destroy();
                if (bad_rows.length) {
                    return res.status(400).json({
                        message: 'One or more rows in the submitted csv file did not pass validation.',
                        badRowNumbers: bad_row_numbers,
                        reason: 'rows',
                    });
                } else {
                    Records.bulkCreate(tracks)
                        .then(() => {
                            const successMessage =
                                rowCount === 1 ? `${rowCount} row added to the database successfully` : `${rowCount} rows added to the database successfully`;
                            logger.log('info', `[createRecords] - ${successMessage} by USER: [${user_name}]`);
                            return res.status(201).json({ message: successMessage });
                        })
                        .catch((err) => {
                            logger.log('error', `[createRecords] bulkCreate catch - ${err.msg}`);
                            res.status(500).json({
                                message: err.message,
                            });
                        });
                }
            })
            .on('close', () => {
                fs.unlink(uploadPath, (err) => {
                    if (err) {
                        logger.log('error', `[createRecords] - Upload Deletion Error - ${err.message}`);
                        throw err;
                    }
                    logger.log('info', `[createRecords] - ${storedFilename} deleted successfully.`);
                });
            });
    } catch (err) {
        logger.log('error', `[createRecords] parsing try block catch - ${err.msg}`);
        res.status(500).json({
            message: err.message,
        });
    }
}; // End createRecords

// Update multiple records
exports.updateRecords = async (req, res) => {
    const submittedRecords = req.body;

    if (!submittedRecords || !submittedRecords.length) return res.status(400).json({ message: 'No tracks submitted' });

    try {
        const result = await Promise.all(
            submittedRecords.map(async (track) => {
                const currentResult = await Records.update(track, {
                    where: { rid: track.rid },
                });
                return currentResult;
            })
        );
        const message = result.length === 1 ? `${result.length} track updated` : `${result.length} tracks updated`;
        logger.log('info', `[updateRecords] - ${message} by USER: [${req.user}]`);
        return res.status(200).json({ message: message });
    } catch (err) {
        logger.log('error', `[updateRecords] - ${err.message}`);
        res.status(500).json({ message: err.message });
    }
};

// Delete Record
exports.deleteRecord = async (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'No id submitted' });

    try {
        const track = await Records.findByPk(id);
        if (!track) return res.sendStatus(204); // Track doesn't exist, so no content to return

        await track
            .destroy()
            .then(() => {
                logger.log('info', `[deleteRecord] - RECORD ID: ${id} deleted`);
                return res.sendStatus(204);
            })
            .catch((err) => {
                logger.log('error', `[deleteRecord] - ${err.message}`);
                return res.status(500).json({ message: err.message });
            });
    } catch (err) {
        logger.log('error', `[deleteRecord] - ${err.message}`);
        return res.status(500).json({ message: err.message });
    }
}; // End deleteRecord function

// Delete Multiple Records
exports.deleteRecords = async (req, res) => {
    const { ids } = req.body;

    if (!ids || ids.length === 0) return res.status(400).json({ message: 'No ids submitted' });

    // ! What happens if some of the ids exist but others don't?
    try {
        await Records.destroy({
            where: {
                rid: ids,
            },
        });
        logger.log('info', `[deleteRecords] = ${ids.length} record(s) destroyed by USER: [${req.user}]`);
        return res.sendStatus(204);
    } catch (err) {
        logger.log('error', `[deleteRecords] - ${err.message}`);
        return res.status(500).json({ message: err.message });
    }
}; // End deleteRecords function
