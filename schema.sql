CREATE DATABASE IF NOT EXISTS havard_hub;
USE havard_hub;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'admin') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    category VARCHAR(50) DEFAULT 'General Training',
    description TEXT
);

-- 3. Enrollments Junction Table (Many-to-Many Relationship)
CREATE TABLE IF NOT EXISTS enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE(student_id, course_id)
);

-- Default Admin Account (Password: admin123)
INSERT INTO users (name, email, password, role) 
VALUES ('Havard Hub Admin', 'admin@havardhub.com', '$2b$10$wT8v0q8/1N3.N20QJk5Mue.60G4w1S88nS6Jc2bO2sE.0u.p3.2S2', 'admin')
ON DUPLICATE KEY UPDATE id=id;

-- Seed All 27 Requested Courses
INSERT INTO courses (title, category, description) VALUES
('Front End Development', 'Technology', 'Master HTML, CSS, JavaScript, and modern web interfaces.'),
('Back End Development', 'Technology', 'Build scalable server-side applications, APIs, and databases.'),
('AI Prompt Engineering', 'Artificial Intelligence', 'Learn how to construct optimal prompts for generative AI models.'),
('IoT (Internet Of Things)', 'Engineering', 'Connect hardware, sensors, and smart devices to web platforms.'),
('Data Analysis', 'Data & AI', 'Extract insights, clean data, and create visual analytical dashboards.'),
('Cyber Security', 'Technology', 'Protect systems, networks, and applications from cyber threats.'),
('Full Stack', 'Technology', 'Combine both Front-End and Back-End development expertise.'),
('Web Design', 'Design', 'Design beautiful, user-friendly layouts for web applications.'),
('UI/UX Design', 'Design', 'Craft user experiences and visual prototypes with industry design tools.'),
('AI & Robotics', 'Robotics', 'Combine artificial intelligence algorithms with hardware automation.'),
('Machine Learning', 'Data & AI', 'Train predictive statistical models with Python and data frameworks.'),
('Make-Ups', 'Vocational', 'Professional beauty, cosmetology, and modern makeup artistry.'),
('Solar Installation', 'Vocational', 'Design, wire, install, and maintain solar energy equipment.'),
('Data Science', 'Data & AI', 'Advance into deep data mining, statistics, and machine learning.'),
('Graphics Design', 'Design', 'Create visual content, brand identities, and promotional materials.'),
('Digital Marketing', 'Business', 'Master SEO, social media marketing, PPC, and audience growth.'),
('Content Creation', 'Media', 'Produce high-converting written, audio, and visual content.'),
('Photography / Photo Editing', 'Media', 'Learn studio lighting, composition, and digital photo retouching.'),
('Video Editing / Videography', 'Media', 'Film professional video and edit dynamic motion visual content.'),
('Project Management', 'Business', 'Lead projects using Agile, Scrum, and classic management tools.'),
('Business Development', 'Business', 'Scale business operations, sales pipelines, and key partnerships.'),
('Cloud Computing', 'Technology', 'Deploy and manage infrastructure on AWS, Azure, and Google Cloud.'),
('Information Technology', 'Technology', 'Core computer networks, enterprise IT maintenance, and support.'),
('Computer Application', 'Technology', 'Master word processing, spreadsheets, and office applications.'),
('Catering', 'Vocational', 'Culinary arts, event planning, and commercial food production.'),
('Fashion Design', 'Vocational', 'Pattern making, garment construction, and modern fashion styling.'),
('Carpentry', 'Vocational', 'Woodworking, structural timber construction, and furniture design');
