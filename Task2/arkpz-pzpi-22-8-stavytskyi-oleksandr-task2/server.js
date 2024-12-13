const express = require('express');
const client = require('./db');
const { registerUser, loginUser } = require('./functions');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
app.use(express.json());

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
    apis: ['./server.js'],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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
   *       - ForCustomer
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

app.listen(3000, () => {
    console.log("Сервер запущено на порту 3000");
});
