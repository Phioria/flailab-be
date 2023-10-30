const db = require('../models');
const Records = db.record;
//const Op = db.Sequelize.Op;
const fs = require('fs');
const csv = require('fast-csv');
const { validHeader, validateRow, ALLOWED_CSV_HEADERS } = require('../utils/validateCsv');

// Get Methods
// Get all records
// TODO change to async await
exports.getAllRecords = (req, res) => {
    Records.findAll({
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
            return res.status(500).json({ message: err.message });
        });
}; // End getAllRecords function

// Get one record by :id
exports.getRecord = async (req, res) => {
    const { id } = req.params;
    const foundRecord = await Records.findOne({ where: { rid: id } });
    if (!foundRecord) return res.sendStatus(404);
    return res.status(200).json(foundRecord);
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

        console.log(req.files.newFile);

        const newFile = req.files.newFile;
        const storedFilename = `${Date.now()}-omicsbase-${newFile.name}`;
        const uploadPath = './assets/uploads/' + storedFilename;

        //console.log(newFile.mimetype);
        if (newFile.mimetype !== 'text/csv') {
            return res.status(400).json({
                message: 'File received was not a CSV file.',
                reason: 'file-type',
            });
        } else {
            let bad_headers = [];
            let bad_rows = [];
            let bad_row_numbers = [];
            let tracks = [];
            await newFile.mv(uploadPath);

            fs.createReadStream(uploadPath)
                .pipe(csv.parse({ headers: true, trim: true, ignoreEmpty: true }))
                .on('error', (error) => console.log(`CSV Upload Error: ${error}`))
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
                                        ? `${rowCount} row added to the database successfully.`
                                        : `${rowCount} rows added to the database successfully.`;
                                return res.status(201).json({ message: successMessage });
                            })
                            .catch((error) => {
                                res.status(500).json({
                                    message: error.message,
                                });
                            });
                    }
                });

            // Delete the uploaded file, as it is no longer needed
            fs.unlink(uploadPath, (err) => {
                if (err) {
                    throw err;
                }
                console.log(`${storedFilename} deleted successfully.`);
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({
            message: 'Could not upload the file: ' + newFile.name,
        });
    }
}; // End createMultipleRecords function

// Update Record :id
// TODO Change to async await
exports.updateRecord = (req, res) => {
    const { id } = req.params;
    /*
    if (!req?.body?.rid)
        return res.status(400).json({ message: 'Record ID required' });
    const id = req.body.rid;
    */
    if (!req?.body?.rid) {
        return res.status(400).json({ message: 'Record data required' });
    }
    Records.update(req.body, {
        where: { rid: id },
    })
        .then((num) => {
            if (num == 1) {
                return res.status(200);
            } else {
                return res.status(500).json({
                    message: 'Track was not able to be updated at this time.',
                });
            }
        })
        .catch((err) => {
            return res.status(500).json({ message: err.message });
        });
}; // End updateRecord function

// Delete Record
exports.deleteRecord = async (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'No id submitted' });

    const track = await Records.findByPk(id);
    if (!track) return res.sendStatus(204); // Track doesn't exist, so no content to return

    await track
        .destroy()
        .then(() => res.sendStatus(204))
        .catch((err) => {
            return res.status(500).json({ message: err.message });
        });
}; // End deleteRecord function

// Delete Multiple Records
exports.deleteRecords = async (req, res) => {
    const { ids } = req.body;
    console.log(ids);
    res.sendStatus(204);

    if (!ids || ids.length === 0) return res.status(400).json({ message: 'No ids submitted' });

    // ! What happens if some of the ids exist but others don't?
    try {
        await Records.destroy({
            where: {
                rid: ids,
            },
        });
        return res.sendStatus;
    } catch (err) {
        return res.send(500).json({ message: err.message });
    }
}; // End deleteRecords function
