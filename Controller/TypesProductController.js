const db = require("../config.js");

const getAllTypes = async (req, res) => {
    const getAllTypesQuery = `
        SELECT 'watch' AS type, WatchTypeID, TypeName FROM watchtypes
        UNION ALL
        SELECT 'fragrance' AS type, FragranceTypeID, TypeName FROM fragrancetypes
        UNION ALL
        SELECT 'bag' AS type, BagTypeID, TypeName FROM bagtypes
    `;

    try {
        db.query(getAllTypesQuery, (err, result) => {
            if (err) return res.status(500).json({ error: err.message });

            // Process the result to structure it accordingly
            const structuredResult = result.reduce((acc, item) => {
                acc[item.type + 'Types'] = acc[item.type + 'Types'] || [];
                acc[item.type + 'Types'].push(item);
                return acc;
            }, {});

            res.json(structuredResult);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getAllTypes };
