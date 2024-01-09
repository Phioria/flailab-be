module.exports = (sequelize, Sequelize) => {
    // Switching to a model that allows for null entries of data only for admin
    // Editors can only upload with certian fields null
    // Will send back response codes if there's a problem with the upload
    const Record = sequelize.define('record', {
        rid: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            allowNull: false,
            primaryKey: true,
        },
        dataset: {
            type: Sequelize.STRING,
            //allowNull: false,
        },
        species: {
            type: Sequelize.STRING,
            //allowNull: false,
        },
        track_name: {
            type: Sequelize.STRING,
            //allowNull: false,
        },
        sequencing_type: {
            type: Sequelize.STRING,
            //allowNull: false,
        },
        file_location: {
            type: Sequelize.STRING,
            //allowNull: false,
        },
        notes: {
            type: Sequelize.TEXT,
        },
        mutant: {
            type: Sequelize.STRING,
            //allowNull: false,
        },
        tissue: {
            type: Sequelize.STRING,
            //allowNull: false,
        },
        cell_line: {
            type: Sequelize.STRING,
        },
        development_stage: {
            type: Sequelize.STRING,
        },
        sex: {
            type: Sequelize.STRING,
            //allowNull: false,
        },
        paper: {
            type: Sequelize.STRING,
        },
        srr_id: {
            type: Sequelize.STRING,
        },
        number_mapped: {
            type: Sequelize.FLOAT,
            //allowNull: false,
        },
        percent_aligned: {
            type: Sequelize.FLOAT,
            //allowNull: false,
        },
        percent_uniquely_mapped: {
            type: Sequelize.FLOAT,
            //allowNull: false,
        },
        submitted_by: {
            // can we default this to the user.name of the person that submitted the file? and maybe add an edited by field?
            type: Sequelize.STRING,
            allowNull: false,
        },
        author: {
            type: Sequelize.STRING,
            //allowNull: false,
        },
        project: {
            type: Sequelize.STRING,
        },
        file_type: {
            type: Sequelize.STRING,
        },
        paired_single_ended: {
            type: Sequelize.STRING,
        },
        file_name: {
            type: Sequelize.STRING,
        },
        unmapped_reads: {
            type: Sequelize.INTEGER,
        },
        reads_mapped_to_plus: {
            type: Sequelize.INTEGER,
        },
        reads_mapped_to_minus: {
            type: Sequelize.INTEGER,
        },
        splice_reads: {
            type: Sequelize.INTEGER,
        },
        non_splice_reads: {
            type: Sequelize.INTEGER,
        },
        library_size: {
            type: Sequelize.INTEGER,
        },
    });

    return Record;
};
