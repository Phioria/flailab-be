// Here ... is a "rest operator"
// Looks just like a "spread operator"
// Lets us pass in as many parameters as we want
// Use after verifyJWT
const verifyRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req?.roles) return res.sendStatus(401);
        const rolesArray = [...allowedRoles]; // Spreads all the parameters passed in into an array
        console.log(rolesArray);
        console.log(req.roles); // Logging both to compare the roles set in verifyjwt to the ones passed in
        const result = req.roles
            .map((role) => rolesArray.includes(role)) // evaluates to true or false
            .find((val) => val === true); // result = first element that was true
        if (!result) return res.sendStatus(401);
        next();
    };
};

module.exports = verifyRoles;
