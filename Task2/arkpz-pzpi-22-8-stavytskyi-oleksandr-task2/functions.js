const client = require('./db');
const bcrypt = require('bcrypt');

// Функція для реєстрації користувача
const registerUser = async (username, password, userGroupId) => {
    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const query = `
            INSERT INTO users (username, password, user_group_id)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const values = [username, hashedPassword, userGroupId];

        const res = await client.query(query, values);
        console.log("Користувач зареєстрований:", res.rows[0]);
        return res.rows[0];
    } catch (err) {
        console.error("Помилка при реєстрації користувача:", err.stack);
        throw err;
    }
};

// Функція для авторизації користувача
const loginUser = async (username, password) => {
    try {
        const query = `SELECT * FROM users WHERE username = $1;`;
        const values = [username];

        const res = await client.query(query, values);

        if (res.rows.length === 0) {
            throw new Error("Користувач не знайдений");
        }

        const user = res.rows[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error("Невірний пароль");
        }

        console.log("Користувач авторизований:", user);
        return user;
    } catch (err) {
        console.error("Помилка при авторизації користувача:", err.stack);
        throw err;
    }
};

module.exports = {
    registerUser,
    loginUser
};
