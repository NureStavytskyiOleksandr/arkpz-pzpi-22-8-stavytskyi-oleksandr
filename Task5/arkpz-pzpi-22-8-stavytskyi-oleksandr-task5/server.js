const express = require('express');
const client = require('./db'); // Імпортуємо клієнт для прямого доступу
const { createUserGroup, updateUserGroup, deleteUserGroup, createUser, updateUser, deleteUser, createParkingGroup, updateParkingGroup, deleteParkingGroup, createParkingSpot, updateParkingSpot, deleteParkingSpot, createBooking, updateBooking, deleteBooking, registerUser, loginUser, findFreeSpots, bookParkingSpot, updateParkingSpotStatus } = require('./functions'); // Функції для CRUD операцій
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const mqtt = require('mqtt'); // Додаємо бібліотеку для роботи з MQTT

const app = express();
app.use(express.json()); // Для обробки JSON в тілі запитів


// MQTT налаштування
const mqtt_server = 'mqtt://broker.emqx.io'; // Брокер для тестування
const mqtt_topic = 'parking/status'; // Топік для підписки

// Підключення до MQTT брокера
const mqttClient = mqtt.connect(mqtt_server);

mqttClient.on('connect', () => {

    mqttClient.subscribe(mqtt_topic, (err) => {
      if (err) {
        console.log('Помилка підписки на топік', err);
      } else {

      }
    });
  });



// Обробка отриманих повідомлень з MQTT
mqttClient.on('message', async (topic, message) => {
    if (topic === mqtt_topic) {
      try {
        // Парсимо отримане повідомлення
        const data = JSON.parse(message.toString());
        const { sensor_id, spot_status } = data;
  
        // Оновлюємо статус місця паркування
        const updatedSpot = await updateParkingSpotStatus(sensor_id, spot_status);
        console.log('Оновлений статус місця паркування:', updatedSpot);
      } catch (err) {
        console.error('Помилка обробки повідомлення MQTT:', err);
      }
    }
  });



// Налаштування Swagger
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API для роботи з "Програмна система для управління паркуванням"',
            version: '1.0.0',
        },
        servers: [
            {
                url: 'http://localhost:3000',
            },
        ],
    },
    apis: ['./server.js'], // Вказуємо файл для генерації документації
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// Створення групи користувачів
/**
 * @swagger
 * /user-groups:
 *   post:
 *     tags:
 *      - UserGroups
 *     summary: Створити групу користувачів
 *     description: Додає нову групу користувачів в систему
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_group_name:
 *                 type: string
 *               user_group_description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Група користувачів створена
 *       500:
 *         description: Виникла помилка при створенні групи
 */
app.post('/user-groups', async (req, res) => {
    const { user_group_name, user_group_description } = req.body;

    try {
        const newGroup = await createUserGroup(user_group_name, user_group_description);
        res.status(201).json(newGroup);
    } catch (err) {
        console.error("Помилка при створенні групи користувачів:", err.stack);
        res.status(500).json({ error: "Не вдалося створити групу користувачів" });
    }
});

// Оновлення групи користувачів
/**
 * @swagger
 * /user-groups/{id}:
 *   put:
 *     tags:
 *      - UserGroups
 *     summary: Оновити групу користувачів
 *     description: Оновлює дані групи користувачів за ID
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID групи користувачів для оновлення
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_group_name:
 *                 type: string
 *               user_group_description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Група користувачів оновлена
 *       500:
 *         description: Виникла помилка при оновленні групи
 */
app.put('/user-groups/:id', async (req, res) => {
    const { id } = req.params;
    const { user_group_name, user_group_description } = req.body;

    try {
        const updatedGroup = await updateUserGroup(id, user_group_name, user_group_description);
        res.status(200).json(updatedGroup);
    } catch (err) {
        console.error("Помилка при оновленні групи користувачів:", err.stack);
        res.status(500).json({ error: "Не вдалося оновити групу користувачів" });
    }
});

// Видалення групи користувачів
/**
 * @swagger
 * /user-groups/{id}:
 *   delete:
 *     tags:
 *      - UserGroups
 *     summary: Видалити групу користувачів
 *     description: Видаляє групу користувачів за ID
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID групи користувачів для видалення
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Група користувачів видалена
 *       500:
 *         description: Виникла помилка при видаленні групи
 */
app.delete('/user-groups/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deletedGroup = await deleteUserGroup(id);
        res.status(200).json(deletedGroup);
    } catch (err) {
        console.error("Помилка при видаленні групи користувачів:", err.stack);
        res.status(500).json({ error: "Не вдалося видалити групу користувачів" });
    }
});

// Створення користувача
/**
 * @swagger
 * /users:
 *   post:
 *     tags:
 *      - Users
 *     summary: Створити користувача
 *     description: Додає нового користувача в систему
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               user_group_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Користувач створений
 *       500:
 *         description: Виникла помилка при створенні користувача
 */
app.post('/users', async (req, res) => {
    const { username, password, user_group_id } = req.body;

    try {
        const newUser = await createUser(username, password, user_group_id);
        res.status(201).json(newUser);
    } catch (err) {
        console.error("Помилка при створенні користувача:", err.stack);
        res.status(500).json({ error: "Не вдалося створити користувача" });
    }
});

// Оновлення користувача
/**
 * @swagger
 * /users/{id}:
 *   put:
 *     tags:
 *      - Users
 *     summary: Оновити користувача
 *     description: Оновлює дані користувача за ID
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID користувача для оновлення
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               user_group_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Користувач оновлений
 *       500:
 *         description: Виникла помилка при оновленні користувача
 */
app.put('/users/:id', async (req, res) => {
    const { id } = req.params;
    const { username, password, user_group_id } = req.body;

    try {
        const updatedUser = await updateUser(id, username, password, user_group_id);
        res.status(200).json(updatedUser);
    } catch (err) {
        console.error("Помилка при оновленні користувача:", err.stack);
        res.status(500).json({ error: "Не вдалося оновити користувача" });
    }
});

// Видалення користувача
/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     tags:
 *      - Users
 *     summary: Видалити користувача
 *     description: Видаляє користувача за ID
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID користувача для видалення
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Користувач видалений
 *       500:
 *         description: Виникла помилка при видаленні користувача
 */
app.delete('/users/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deletedUser = await deleteUser(id);
        res.status(200).json(deletedUser);
    } catch (err) {
        console.error("Помилка при видаленні користувача:", err.stack);
        res.status(500).json({ error: "Не вдалося видалити користувача" });
    }
});

// Створення групи паркування
/**
 * @swagger
 * /parking-groups:
 *   post:
 *     tags:
 *      - ParkingGroups
 *     summary: Створити групу паркування
 *     description: Додає нову групу паркування в систему
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               parking_group_name:
 *                 type: string
 *               parking_group_description:
 *                 type: string
 *               user_group_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Група паркування створена
 *       500:
 *         description: Виникла помилка при створенні групи паркування
 */
app.post('/parking-groups', async (req, res) => {
    const { parking_group_name, parking_group_description, user_group_id } = req.body;

    try {
        const newGroup = await createParkingGroup(parking_group_name, parking_group_description, user_group_id);
        res.status(201).json(newGroup);
    } catch (err) {
        console.error("Помилка при створенні групи паркування:", err.stack);
        res.status(500).json({ error: "Не вдалося створити групу паркування" });
    }
});

// Оновлення групи паркування
/**
 * @swagger
 * /parking-groups/{id}:
 *   put:
 *     tags:
 *      - ParkingGroups
 *     summary: Оновити групу паркування
 *     description: Оновлює дані групи паркування за ID
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID групи паркування для оновлення
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               parking_group_name:
 *                 type: string
 *               parking_group_description:
 *                 type: string
 *               user_group_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Група паркування оновлена
 *       500:
 *         description: Виникла помилка при оновленні групи паркування
 */
app.put('/parking-groups/:id', async (req, res) => {
    const { id } = req.params;
    const { parking_group_name, parking_group_description, user_group_id } = req.body;

    try {
        const updatedGroup = await updateParkingGroup(id, parking_group_name, parking_group_description, user_group_id);
        res.status(200).json(updatedGroup);
    } catch (err) {
        console.error("Помилка при оновленні групи паркування:", err.stack);
        res.status(500).json({ error: "Не вдалося оновити групу паркування" });
    }
});

// Видалення групи паркування
/**
 * @swagger
 * /parking-groups/{id}:
 *   delete:
 *     tags:
 *      - ParkingGroups
 *     summary: Видалити групу паркування
 *     description: Видаляє групу паркування за ID
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID групи паркування для видалення
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Група паркування видалена
 *       500:
 *         description: Виникла помилка при видаленні групи паркування
 */
app.delete('/parking-groups/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deletedGroup = await deleteParkingGroup(id);
        res.status(200).json(deletedGroup);
    } catch (err) {
        console.error("Помилка при видаленні групи паркування:", err.stack);
        res.status(500).json({ error: "Не вдалося видалити групу паркування" });
    }
});

// Створення місця паркування
/**
 * @swagger
 * /parking-spots:
 *   post:
 *     tags:
 *      - ParkingSpots
 *     summary: Створити місце паркування
 *     description: Додає нове місце паркування в систему
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               spot_number:
 *                 type: integer
 *               sensor_id:
 *                 type: integer
 *               spot_status:
 *                 type: boolean
 *               parking_group_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Місце паркування створене
 *       500:
 *         description: Виникла помилка при створенні місця паркування
 */
app.post('/parking-spots', async (req, res) => {
    const { spot_number, sensor_id, spot_status, parking_group_id } = req.body;

    try {
        const newSpot = await createParkingSpot(spot_number, sensor_id, spot_status, parking_group_id);
        res.status(201).json(newSpot);
    } catch (err) {
        console.error("Помилка при створенні місця паркування:", err.stack);
        res.status(500).json({ error: "Не вдалося створити місце паркування" });
    }
});

// Оновлення місця паркування
/**
 * @swagger
 * /parking-spots/{id}:
 *   put:
 *     tags:
 *      - ParkingSpots
 *     summary: Оновити місце паркування
 *     description: Оновлює дані місця паркування за ID
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID місця паркування для оновлення
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               spot_number:
 *                 type: integer
 *               sensor_id:
 *                 type: integer
 *               spot_status:
 *                 type: boolean
 *               parking_group_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Місце паркування оновлено
 *       500:
 *         description: Виникла помилка при оновленні місця паркування
 */
app.put('/parking-spots/:id', async (req, res) => {
    const { id } = req.params;
    const { spot_number, sensor_id, spot_status, parking_group_id } = req.body;

    try {
        const updatedSpot = await updateParkingSpot(id, spot_number, sensor_id, spot_status, parking_group_id);
        res.status(200).json(updatedSpot);
    } catch (err) {
        console.error("Помилка при оновленні місця паркування:", err.stack);
        res.status(500).json({ error: "Не вдалося оновити місце паркування" });
    }
});

// Видалення місця паркування
/**
 * @swagger
 * /parking-spots/{id}:
 *   delete:
 *     tags:
 *      - ParkingSpots
 *     summary: Видалити місце паркування
 *     description: Видаляє місце паркування за ID
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID місця паркування для видалення
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Місце паркування видалено
 *       500:
 *         description: Виникла помилка при видаленні місця паркування
 */
app.delete('/parking-spots/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deletedSpot = await deleteParkingSpot(id);
        res.status(200).json(deletedSpot);
    } catch (err) {
        console.error("Помилка при видаленні місця паркування:", err.stack);
        res.status(500).json({ error: "Не вдалося видалити місце паркування" });
    }
});

// Створення бронювання
/**
 * @swagger
 * /bookings:
 *   post:
 *     tags:
 *       - Bookings
 *     summary: Створити бронювання
 *     description: Створює нове бронювання на паркувальне місце
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *               parking_spot_id:
 *                 type: integer
 *               start_time:
 *                 type: string
 *                 format: date-time
 *               end_time:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Бронювання створене
 *       500:
 *         description: Виникла помилка при створенні бронювання
 */
app.post('/bookings', async (req, res) => {
    const { user_id, parking_spot_id, start_time, end_time} = req.body;

    try {
        const newBooking = await createBooking(user_id, parking_spot_id, start_time, end_time);
        res.status(201).json(newBooking);
    } catch (err) {
        console.error("Помилка при створенні бронювання:", err.stack);
        res.status(500).json({ error: "Не вдалося створити бронювання" });
    }
});

// Оновлення бронювання
/**
 * @swagger
 * /bookings/{id}:
 *   put:
 *     tags:
 *       - Bookings
 *     summary: Оновити бронювання
 *     description: Оновлює дані бронювання за ID
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID бронювання для оновлення
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *               parking_spot_id:
 *                 type: integer
 *               start_time:
 *                 type: string
 *                 format: date-time
 *               end_time:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Бронювання оновлено
 *       500:
 *         description: Виникла помилка при оновленні бронювання
 */
app.put('/bookings/:id', async (req, res) => {
    const { id } = req.params;
    const { user_id, parking_spot_id, start_time, end_time} = req.body;

    try {
        const updatedBooking = await updateBooking(id, user_id, parking_spot_id, start_time, end_time);
        res.status(200).json(updatedBooking);
    } catch (err) {
        console.error("Помилка при оновленні бронювання:", err.stack);
        res.status(500).json({ error: "Не вдалося оновити бронювання" });
    }
});

// Видалення бронювання
/**
 * @swagger
 * /bookings/{id}:
 *   delete:
 *     tags:
 *       - Bookings
 *     summary: Видалити бронювання
 *     description: Видаляє бронювання за ID
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID бронювання для видалення
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Бронювання видалено
 *       500:
 *         description: Виникла помилка при видаленні бронювання
 */
app.delete('/bookings/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deletedBooking = await deleteBooking(id);
        res.status(200).json(deletedBooking);
    } catch (err) {
        console.error("Помилка при видаленні бронювання:", err.stack);
        res.status(500).json({ error: "Не вдалося видалити бронювання" });
    }
});

/**
 * @swagger
 * /register:
 *   post:
 *     tags:
 *       - ForCustomer
 *     description: Реєстрація користувача
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               userGroupId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Успішно зареєстровано користувача
 *       400:
 *         description: Помилка при реєстрації
 */
app.post('/register', async (req, res) => {
    const { username, password, userGroupId } = req.body;
    try {
      const user = await registerUser(username, password, userGroupId);
      res.status(200).json(user);
    } catch (err) {
      res.status(400).json({ error: 'Помилка при реєстрації користувача' });
    }
  });
  
  /**
   * @swagger
   * /login:
   *   post:
   *     tags:
 *          - ForCustomer
   *     description: Авторизація користувача
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               username:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Успішно авторизовано користувача
   *       400:
   *         description: Невірний логін або пароль
   */
  app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
      const user = await loginUser(username, password);
      res.status(200).json(user);
    } catch (err) {
      res.status(400).json({ error: 'Невірний логін або пароль' });
    }
  });
  
  /**
   * @swagger
   * /find-free-spots/{userId}:
   *   get:
   *     tags:
 *          - ForCustomer
   *     description: Пошук вільних паркувальних місць
   *     parameters:
   *       - name: userId
   *         in: path
   *         required: true
   *         description: ID користувача для пошуку вільних місць
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Успішно знайдено вільні місця
   *       404:
   *         description: Вільних місць не знайдено
   */
  app.get('/find-free-spots/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
      const spots = await findFreeSpots(userId);
      if (spots.length === 0) {
        return res.status(404).json({ message: 'Вільних паркувальних місць не знайдено' });
      }
      res.status(200).json(spots);
    } catch (err) {
      res.status(500).json({ error: 'Помилка при пошуку вільних місць' });
    }
  });

/**
 * @swagger
 * /book:
 *   post:
 *     tags:
 *          - ForCustomer
 *     summary: Забронювати паркувальне місце
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - parkingSpotId
 *               - startTime
 *               - endTime
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: ID користувача, який здійснює бронювання
 *               parkingSpotId:
 *                 type: integer
 *                 description: ID паркувального місця для бронювання
 *               startTime:
 *                 type: string
 *                 format: date-time
 *                 description: Час початку бронювання
 *               endTime:
 *                 type: string
 *                 format: date-time
 *                 description: Час завершення бронювання
 *     responses:
 *       201:
 *         description: Паркувальне місце успішно заброньовано
 *       400:
 *         description: Помилка бронювання
 */
app.post('/book', async (req, res) => {
    const { userId, parkingSpotId, startTime, endTime } = req.body;
  
    try {
      const booking = await bookParkingSpot(userId, parkingSpotId, startTime, endTime);
      res.status(201).json({
        message: 'Паркувальне місце успішно заброньовано.',
        booking,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

// Запуск сервера
app.listen(3000, () => {
    console.log("Сервер запущено на порту 3000");
});
