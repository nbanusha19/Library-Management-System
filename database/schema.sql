-- Library Management System schema
DROP DATABASE IF EXISTS library_db;
CREATE DATABASE library_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE library_db;

-- Admin accounts
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User registration + approval state
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(30) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    status ENUM('pending','approved','rejected') NOT NULL,
    comment VARCHAR(255) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_status_history_user (user_id)
);

-- Books catalog
CREATE TABLE books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    subject ENUM('Science','Kannada','English','Mathematics','Social Studies','Sanskrit','Hindi') NOT NULL,
    total_copies INT NOT NULL DEFAULT 1,
    available_copies INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Borrow & return records (records belong to approved users)
CREATE TABLE borrow_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    user_id INT NOT NULL,
    borrower_name VARCHAR(255) NOT NULL,
    borrow_date DATE NOT NULL,
    due_date DATE NOT NULL,
    returned_date DATE DEFAULT NULL,
    status ENUM('borrowed','returned') NOT NULL DEFAULT 'borrowed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_book (book_id),
    INDEX idx_user (user_id)
);

-- Seed sample admin and books
INSERT INTO admins (username, email, password) VALUES
('admin', 'admin@example.com', 'admin123');

INSERT INTO books (title, author, subject, total_copies, available_copies) VALUES
('Fundamentals of Physics','Halliday & Resnick','Science',3,3),
('Concepts of Chemistry','O.P. Tandon','Science',2,2),
('Kuvempu Kavyagalu','Kuvempu','Kannada',2,2),
('Mookajjiya Kanasugalu','K. Shivaram Karanth','Kannada',2,2),
('Wings of Fire','A.P.J. Abdul Kalam','English',4,4),
('The God of Small Things','Arundhati Roy','English',2,2),
('Higher Algebra','Hall & Knight','Mathematics',3,3),
('Calculus Made Easy','Silvanus P. Thompson','Mathematics',2,2),
('India: A History','John Keay','Social Studies',2,2),
('Indian Polity','M. Laxmikanth','Social Studies',3,3),
('Sanskrit Grammar','Panini','Sanskrit',2,2),
('Bhagavad Gita (Sanskrit)','Vyasa','Sanskrit',2,2),
('Godan','Munshi Premchand','Hindi',3,3),
('Madhushala','Harivansh Rai Bachchan','Hindi',2,2),
('Mathematics','Library Admin','Mathematics',1,1),
('Science','Library Admin','Science',1,1),
('English','Library Admin','English',1,1),
('Kannada','Library Admin','Kannada',1,1),
('Hindi','Library Admin','Hindi',1,1),
('Sanskrit','Library Admin','Sanskrit',1,1),
('Social Studies','Library Admin','Social Studies',1,1);
