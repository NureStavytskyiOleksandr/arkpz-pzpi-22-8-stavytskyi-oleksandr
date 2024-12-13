const client = require('./db');
const bcrypt = require('bcrypt');

// Функція для реєстрації користувача
const registerUser = async (username, password, userGroupId) => {
    try {
        // Хешуємо пароль
        const hashedPassword = await bcrypt.hash(password, 10);

        // SQL-запит для створення користувача
        const query = `
            INSERT INTO users (username, password, user_group_id)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const values = [username, hashedPassword, userGroupId];

        const res = await client.query(query, values);
        console.log("Користувач зареєстрований:", res.rows[0]);
        return res.rows[0]; // Повертаємо створеного користувача
    } catch (err) {
        console.error("Помилка при реєстрації користувача:", err.stack);
        throw err;
    }
};

// Функція для авторизації користувача
const loginUser = async (username, password) => {
    try {
        // SQL-запит для отримання користувача за ім'ям
        const query = `SELECT * FROM users WHERE username = $1;`;
        const values = [username];

        const res = await client.query(query, values);

        if (res.rows.length === 0) {
            throw new Error("Користувач не знайдений");
        }

        const user = res.rows[0];

        // Перевірка пароля
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error("Невірний пароль");
        }

        console.log("Користувач авторизований:", user);
        return user; // Повертаємо дані користувача
    } catch (err) {
        console.error("Помилка при авторизації користувача:", err.stack);
        throw err;
    }
};

// Функція для пошуку вільних паркувальних місць
const findFreeSpots = async (userId) => {
    const query = `
        SELECT ps.*
        FROM parking_spots ps
        JOIN parking_groups pg ON ps.parking_group_id = pg.parking_group_id
        JOIN user_groups ug ON pg.user_group_id = ug.user_group_id
        JOIN users u ON ug.user_group_id = u.user_group_id
        WHERE u.user_id = $1 AND ps.spot_status = false;
    `;

    try {
        const res = await client.query(query, [userId]);
        if (res.rows.length === 0) {
            console.log("Вільних паркувальних місць не знайдено");
            return [];
        }
        console.log("Знайдені вільні місця:", res.rows);
        return res.rows; // Повертає список вільних місць
    } catch (err) {
        console.error("Помилка при пошуку вільних місць:", err.stack);
        throw err;
    }
};

// Функція для бронювання паркувального місця
async function bookParkingSpot(userId, parkingSpotId, startTime, endTime) {
    try {
      await client.query('BEGIN');
  
      // Перевірка, чи користувач може забронювати це місце
      const checkQuery = `
        SELECT * 
        FROM parking_spots ps
        JOIN parking_groups pg ON ps.parking_group_id = pg.parking_group_id
        JOIN user_groups ug ON pg.user_group_id = ug.user_group_id
        JOIN users u ON u.user_group_id = ug.user_group_id
        WHERE ps.parking_spot_id = $1
          AND u.user_id = $2
          AND NOT EXISTS (
              SELECT 1 
              FROM bookings b 
              WHERE b.parking_spot_id = ps.parking_spot_id
                AND b.start_time < $4
                AND b.end_time > $3
          );
      `;
  
      const result = await client.query(checkQuery, [
        parkingSpotId,
        userId,
        startTime,
        endTime,
      ]);
  
      if (result.rows.length === 0) {
        throw new Error(
          'Паркувальне місце недоступне або ви не маєте доступу до цього місця.'
        );
      }
  
      // Бронювання місця
      const insertQuery = `
        INSERT INTO bookings (user_id, parking_spot_id, start_time, end_time) 
        VALUES ($1, $2, $3, $4) RETURNING *;
      `;
      const booking = await client.query(insertQuery, [
        userId,
        parkingSpotId,
        startTime,
        endTime,
      ]);
  
      await client.query('COMMIT');
      return booking.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
}

// Функція для створення групи користувачів
const createUserGroup = async (userGroupName, userGroupDescription) => {
    const query = `
        INSERT INTO user_groups (user_group_name, user_group_description)
        VALUES ($1, $2)
        RETURNING *;
    `;
    const values = [userGroupName, userGroupDescription];

    try {
        const res = await client.query(query, values);
        console.log("Група користувачів створена:", res.rows[0]);
        return res.rows[0]; // Повертаємо створений запис
    } catch (err) {
        console.error("Помилка при створенні групи користувачів:", err.stack);
        throw err; // Передаємо помилку далі для обробки
    }
};

// Функція для редагування групи користувачів
const updateUserGroup = async (userGroupId, userGroupName, userGroupDescription) => {
    const query = `
        UPDATE user_groups
        SET user_group_name = $1, user_group_description = $2
        WHERE user_group_id = $3
        RETURNING *;
    `;
    const values = [userGroupName, userGroupDescription, userGroupId];

    try {
        const res = await client.query(query, values);
        if (res.rows.length === 0) {
            throw new Error("Групу користувачів з таким ID не знайдено");
        }
        console.log("Група користувачів оновлена:", res.rows[0]);
        return res.rows[0]; // Повертаємо оновлений запис
    } catch (err) {
        console.error("Помилка при оновленні групи користувачів:", err.stack);
        throw err; // Передаємо помилку далі для обробки
    }
};

// Функція для видалення групи користувачів
const deleteUserGroup = async (userGroupId) => {
    const query = `
        DELETE FROM user_groups
        WHERE user_group_id = $1
        RETURNING *;
    `;
    const values = [userGroupId];

    try {
        const res = await client.query(query, values);
        if (res.rows.length === 0) {
            throw new Error("Групу користувачів з таким ID не знайдено");
        }
        console.log("Група користувачів видалена:", res.rows[0]);
        return res.rows[0]; // Повертаємо видалений запис
    } catch (err) {
        console.error("Помилка при видаленні групи користувачів:", err.stack);
        throw err; // Передаємо помилку далі для обробки
    }
};

// Функція для створення користувача
const createUser = async (username, password, userGroupId) => {
    const query = `
        INSERT INTO users (username, password, user_group_id)
        VALUES ($1, $2, $3)
        RETURNING *;
    `;
    const values = [username, password, userGroupId];

    try {
        const res = await client.query(query, values);
        console.log("Користувач створений:", res.rows[0]);
        return res.rows[0];
    } catch (err) {
        console.error("Помилка при створенні користувача:", err.stack);
        throw err;
    }
};

// Функція для оновлення користувача
const updateUser = async (userId, username, password, userGroupId) => {
    const query = `
        UPDATE users
        SET username = $1, password = $2, user_group_id = $3
        WHERE user_id = $4
        RETURNING *;
    `;
    const values = [username, password, userGroupId, userId];

    try {
        const res = await client.query(query, values);
        if (res.rows.length === 0) {
            throw new Error("Користувача з таким ID не знайдено");
        }
        console.log("Користувач оновлений:", res.rows[0]);
        return res.rows[0];
    } catch (err) {
        console.error("Помилка при оновленні користувача:", err.stack);
        throw err;
    }
};

// Функція для видалення користувача
const deleteUser = async (userId) => {
    const query = `
        DELETE FROM users
        WHERE user_id = $1
        RETURNING *;
    `;
    const values = [userId];

    try {
        const res = await client.query(query, values);
        if (res.rows.length === 0) {
            throw new Error("Користувача з таким ID не знайдено");
        }
        console.log("Користувач видалений:", res.rows[0]);
        return res.rows[0];
    } catch (err) {
        console.error("Помилка при видаленні користувача:", err.stack);
        throw err;
    }
};

// Функція для створення групи паркування
const createParkingGroup = async (parkingGroupName, parkingGroupDescription, userGroupId) => {
    const query = `
        INSERT INTO parking_groups (parking_group_name, parking_group_description, user_group_id)
        VALUES ($1, $2, $3)
        RETURNING *;
    `;
    const values = [parkingGroupName, parkingGroupDescription, userGroupId];

    try {
        const res = await client.query(query, values);
        console.log("Група паркування створена:", res.rows[0]);
        return res.rows[0];
    } catch (err) {
        console.error("Помилка при створенні групи паркування:", err.stack);
        throw err;
    }
};

// Функція для редагування групи паркування
const updateParkingGroup = async (parkingGroupId, parkingGroupName, parkingGroupDescription, userGropId) => {
    const query = `
        UPDATE parking_groups
        SET parking_group_name = $1, parking_group_description = $2, user_group_id = $3
        WHERE parking_group_id = $4
        RETURNING *;
    `;
    const values = [parkingGroupName, parkingGroupDescription, userGropId, parkingGroupId];

    try {
        const res = await client.query(query, values);
        if (res.rows.length === 0) {
            throw new Error("Групу паркування з таким ID не знайдено");
        }
        console.log("Група паркування оновлена:", res.rows[0]);
        return res.rows[0];
    } catch (err) {
        console.error("Помилка при оновленні групи паркування:", err.stack);
        throw err;
    }
};

// Функція для видалення групи паркування
const deleteParkingGroup = async (parkingGroupId) => {
    const query = `
        DELETE FROM parking_groups
        WHERE parking_group_id = $1
        RETURNING *;
    `;
    const values = [parkingGroupId];

    try {
        const res = await client.query(query, values);
        if (res.rows.length === 0) {
            throw new Error("Групу паркування з таким ID не знайдено");
        }
        console.log("Група паркування видалена:", res.rows[0]);
        return res.rows[0];
    } catch (err) {
        console.error("Помилка при видаленні групи паркування:", err.stack);
        throw err;
    }
};

// Функція для створення місця паркування
const createParkingSpot = async (spotNumber, spotStatus, parkingGroupId) => {
    const query = `
        INSERT INTO parking_spots (spot_number, spot_status, parking_group_id)
        VALUES ($1, $2, $3)
        RETURNING *;
    `;
    const values = [spotNumber, spotStatus, parkingGroupId];

    try {
        const res = await client.query(query, values);
        console.log("Місце паркування створене:", res.rows[0]);
        return res.rows[0];
    } catch (err) {
        console.error("Помилка при створенні місця паркування:", err.stack);
        throw err;
    }
};

// Функція для редагування місця паркування
const updateParkingSpot = async (parkingSpotId, spotNumber, spotStatus, parkingGroupId) => {
    const query = `
        UPDATE parking_spots
        SET spot_number = $1, spot_status = $2, parking_group_id = $3
        WHERE parking_spot_id = $4
        RETURNING *;
    `;
    const values = [spotNumber, spotStatus, parkingGroupId, parkingSpotId];

    try {
        const res = await client.query(query, values);
        if (res.rows.length === 0) {
            throw new Error("Місце паркування з таким ID не знайдено");
        }
        console.log("Місце паркування оновлене:", res.rows[0]);
        return res.rows[0];
    } catch (err) {
        console.error("Помилка при оновленні місця паркування:", err.stack);
        throw err;
    }
};

// Функція для видалення місця паркування
const deleteParkingSpot = async (parkingSpotId) => {
    const query = `
        DELETE FROM parking_spots
        WHERE parking_spot_id = $1
        RETURNING *;
    `;
    const values = [parkingSpotId];

    try {
        const res = await client.query(query, values);
        if (res.rows.length === 0) {
            throw new Error("Місце паркування з таким ID не знайдено");
        }
        console.log("Місце паркування видалене:", res.rows[0]);
        return res.rows[0];
    } catch (err) {
        console.error("Помилка при видаленні місця паркування:", err.stack);
        throw err;
    }
};

// Функція для створення бронювання
const createBooking = async (userId, parkingSpotId, startTime, endTime) => {
    const query = `
        INSERT INTO bookings (user_id, parking_spot_id, start_time, end_time)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `;
    const values = [userId, parkingSpotId, startTime, endTime];

    try {
        const res = await client.query(query, values);
        console.log("Бронювання створено:", res.rows[0]);
        return res.rows[0];
    } catch (err) {
        console.error("Помилка при створенні бронювання:", err.stack);
        throw err;
    }
};

// Функція для оновлення бронювання
const updateBooking = async (bookingId, userId, parkingSpotId, startTime, endTime) => {
    const query = `
        UPDATE bookings
        SET user_id = $1, parking_spot_id = $2, start_time = $3, end_time = $4
        WHERE booking_id = $5
        RETURNING *;
    `;
    const values = [userId, parkingSpotId, startTime, endTime, bookingId];

    try {
        const res = await client.query(query, values);
        if (res.rows.length === 0) {
            throw new Error("Бронювання з таким ID не знайдено");
        }
        console.log("Бронювання оновлене:", res.rows[0]);
        return res.rows[0];
    } catch (err) {
        console.error("Помилка при оновленні бронювання:", err.stack);
        throw err;
    }
};

// Функція для видалення бронювання
const deleteBooking = async (bookingId) => {
    const query = `
        DELETE FROM bookings
        WHERE booking_id = $1
        RETURNING *;
    `;
    const values = [bookingId];

    try {
        const res = await client.query(query, values);
        if (res.rows.length === 0) {
            throw new Error("Бронювання з таким ID не знайдено");
        }
        console.log("Бронювання видалено:", res.rows[0]);
        return res.rows[0];
    } catch (err) {
        console.error("Помилка при видаленні бронювання:", err.stack);
        throw err;
    }
};

    
module.exports = {
    createUserGroup,
    updateUserGroup,
    deleteUserGroup,
    createUser,
    updateUser,
    deleteUser,
    createParkingGroup,
    updateParkingGroup,
    deleteParkingGroup,
    createParkingSpot,
    updateParkingSpot,
    deleteParkingSpot,
    createBooking,
    updateBooking,
    deleteBooking,
    registerUser,
    loginUser,
    findFreeSpots,
    bookParkingSpot
};
