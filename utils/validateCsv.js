const ROLES_LIST = require('../config/roles_list');

const ALLOWED_CSV_HEADERS = [
    'dataset',
    'species',
    'track_name',
    'sequencing_type',
    'file_location',
    'mutant',
    'tissue',
    'sex',
    'total_mapped',
    'percent_aligned',
    'percent_uniquely_mapped',
    'author',
    'cell_line',
    'development_stage',
    'project',
    'paper',
    'srr_id',
    'notes',
    'file_type',
    'paired_single_ended',
    'file_name',
    'unmapped_reads',
    'reads_mapped_to_plus',
    'reads_mapped_to_minus',
    'splice_reads',
    'non_splice_reads',
];

const validHeader = (header) => {
    return ALLOWED_CSV_HEADERS.includes(header.toLowerCase());
};

// This ensures that certain rows don't contain any empty data before submission
const validateRow = (row, roles) => {
    if (roles.includes(ROLES_LIST.Admin)) {
        return row.dataset.length && row.species.length && row.sequencing_type.length && row.file_location.length && row.tissue.length;
    } else {
        // Check to see if the numeric cells are empty then check to see if you can strip a percent sign off them and force them to float. If they're NaN, return false
        // These should always come in as strings to start with, so running .replace on them shouldn't throw an error...guess we'll see
        const isTotalMappedNumeric = row.total_mapped.length && !isNaN(parseFloat(row.total_mapped.replace('%', '')));
        const isPercentAlignedNumeric = row.percent_aligned.length && !isNaN(parseFloat(row.percent_aligned.replace('%', '')));
        const isPercentUniquelyMappedNumeric = row.percent_uniquely_mapped.length && !isNaN(parseFloat(row.percent_uniquely_mapped.replace('%', '')));

        return (
            row.dataset.length &&
            row.species.length &&
            row.track_name.length &&
            row.sequencing_type.length &&
            row.file_location.length &&
            row.mutant.length &&
            row.tissue.length &&
            row.sex.length &&
            isTotalMappedNumeric &&
            isPercentAlignedNumeric &&
            isPercentUniquelyMappedNumeric &&
            row.author.length
        );
    }
};

module.exports = { validHeader, validateRow, ALLOWED_CSV_HEADERS };
