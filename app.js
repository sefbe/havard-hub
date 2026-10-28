const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const db = require('./config/db');

const app = express();

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'havard_hub_secure_session_secret',
    resave: false,
    saveUninitialized: false
}));

// Pass Session User Data to All EJS Views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Authentication Guard Middlewares
const isAuthenticated = (req, res, next) => {
    if (req.session.user) return next();
    res.redirect('/login');
};

const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') return next();
    res.status(403).send("Access Denied: Admin authorization required.");
};

// --- PUBLIC ROUTES ---

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/courses', async (req, res) => {
    try {
        const [courses] = await db.query('SELECT * FROM courses ORDER BY category, title');
        res.render('courses', { courses });
    } catch (err) {
        res.status(500).send("Database error loading courses.");
    }
});

app.get('/about', (req, res) => res.render('about'));
app.get('/contact', (req, res) => res.render('contact'));

// --- AUTHENTICATION ROUTES ---

app.get('/login', (req, res) => res.render('login', { error: null }));
app.get('/signup', (req, res) => res.render('signup', { error: null }));

app.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);
        res.redirect('/login');
    } catch (err) {
        res.render('signup', { error: "Email is already registered or invalid." });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length > 0 && await bcrypt.compare(password, users[0].password)) {
            req.session.user = { id: users[0].id, name: users[0].name, role: users[0].role };
            return users[0].role === 'admin' ? res.redirect('/admin') : res.redirect('/profile');
        }
        res.render('login', { error: "Invalid email or password." });
    } catch (err) {
        res.render('login', { error: "An unexpected error occurred." });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// --- STUDENT PROFILE & ENROLLMENT ROUTES ---

app.get('/profile', isAuthenticated, async (req, res) => {
    const userId = req.session.user.id;
    try {
        const [user] = await db.query('SELECT name, email FROM users WHERE id = ?', [userId]);
        const [enrolled] = await db.query(
            'SELECT c.id, c.title, c.category FROM courses c JOIN enrollments e ON c.id = e.course_id WHERE e.student_id = ?', 
            [userId]
        );
        const [allCourses] = await db.query('SELECT * FROM courses ORDER BY title');
        
        const enrolledIds = enrolled.map(c => c.id);
        const available = allCourses.filter(c => !enrolledIds.includes(c.id));

        res.render('profile', {
            student: user[0],
            enrolledCourses: enrolled,
            availableCourses: available
        });
    } catch (err) {
        res.status(500).send("Error loading profile.");
    }
});

app.post('/profile/update', isAuthenticated, async (req, res) => {
    const { name, email } = req.body;
    try {
        await db.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, req.session.user.id]);
        req.session.user.name = name;
        res.redirect('/profile');
    } catch (err) {
        res.status(400).send("Error updating profile.");
    }
});

app.post('/profile/delete', isAuthenticated, async (req, res) => {
    try {
        await db.query('DELETE FROM users WHERE id = ?', [req.session.user.id]);
        req.session.destroy();
        res.redirect('/');
    } catch (err) {
        res.status(500).send("Error deleting account.");
    }
});

app.post('/enroll', isAuthenticated, async (req, res) => {
    const { course_id } = req.body;
    try {
        await db.query('INSERT IGNORE INTO enrollments (student_id, course_id) VALUES (?, ?)', [req.session.user.id, course_id]);
        res.redirect('/profile');
    } catch (err) {
        res.status(500).send("Enrollment failed.");
    }
});

app.post('/enroll/cancel', isAuthenticated, async (req, res) => {
    const { course_id } = req.body;
    try {
        await db.query('DELETE FROM enrollments WHERE student_id = ? AND course_id = ?', [req.session.user.id, course_id]);
        res.redirect('/profile');
    } catch (err) {
        res.status(500).send("Failed to cancel enrollment.");
    }
});

// --- ADMIN CONTROL ROUTES ---

app.get('/admin', isAdmin, async (req, res) => {
    try {
        const [courses] = await db.query('SELECT * FROM courses ORDER BY title ASC');
        const [students] = await db.query(`
            SELECT u.id, u.name, u.email, GROUP_CONCAT(c.title SEPARATOR ', ') as enrolled_courses 
            FROM users u 
            LEFT JOIN enrollments e ON u.id = e.student_id 
            LEFT JOIN courses c ON e.course_id = c.id 
            WHERE u.role = 'student' 
            GROUP BY u.id
        `);
        res.render('admin', { courses, students });
    } catch (err) {
        res.status(500).send("Error loading admin dashboard.");
    }
});

app.post('/admin/course/add', isAdmin, async (req, res) => {
    const { title, category } = req.body;
    try {
        await db.query('INSERT INTO courses (title, category) VALUES (?, ?)', [title, category || 'General']);
        res.redirect('/admin');
    } catch (err) {
        res.status(500).send("Error adding course.");
    }
});

app.post('/admin/course/delete', isAdmin, async (req, res) => {
    try {
        await db.query('DELETE FROM courses WHERE id = ?', [req.body.course_id]);
        res.redirect('/admin');
    } catch (err) {
        res.status(500).send("Error deleting course.");
    }
});

app.post('/admin/student/delete', isAdmin, async (req, res) => {
    try {
        await db.query('DELETE FROM users WHERE id = ?', [req.body.student_id]);
        res.redirect('/admin');
    } catch (err) {
        res.status(500).send("Error deleting student.");
    }
});

// Run Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Havard Hub Server running on http://localhost:${PORT}`);
});
