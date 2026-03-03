function signUpController(req, res) {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }
   
    //validate your data here (e.g., check if email is valid, password strength, etc.)
    const databaseUsername = "johndoe"; // Placeholder for database username check
    if (username === databaseUsername) {
        return res.status(409).json({ message: "Username already exists" });
    }
    res.status(201).json({ message: `${username} Sign Up endpoint is working` });
}

function signInController(req, res) {
 const { email, password } = req.body;
    if ( !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }
     const dbEmail = "janedoe@gmail.com"; // Placeholder for database email check

    if (email !== dbEmail) {
        return res.status(404).json({ message: "Email does not exist" });
    }
     const dbPassword = "123123"; // Placeholder for database password check
     if (password !== dbPassword) {
        return res.status(401).json({ message: "Incorrect password" });
    }

    const dbUsername = "janedoe"; // Placeholder for database username check
    
    res.status(200).json({ user:{ username: dbUsername, email: dbEmail }, message: `${dbUsername} Sign In endpoint is working` });
}

module.exports = { signUpController, signInController };