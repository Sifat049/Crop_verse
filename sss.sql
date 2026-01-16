CREATE DATABASE cropverse;

USE cropverse;


CREATE TABLE Farmer (
    farmer_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    district VARCHAR(50) NOT NULL,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE Buyer (
    buyer_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE Crop (
    crop_id INT PRIMARY KEY AUTO_INCREMENT,
    crop_name VARCHAR(50) NOT NULL,
    category VARCHAR(50)
);
CREATE TABLE CropListing (
    listing_id INT PRIMARY KEY AUTO_INCREMENT,
    farmer_id INT NOT NULL,
    crop_id INT NOT NULL,
    quantity_kg DECIMAL(10,2) NOT NULL,
    price_per_kg DECIMAL(10,2) NOT NULL,
    status ENUM('Available','Sold') DEFAULT 'Available',
    listed_at DATE NOT NULL,
    FOREIGN KEY (farmer_id) REFERENCES Farmer(farmer_id),
    FOREIGN KEY (crop_id) REFERENCES Crop(crop_id)
);
CREATE TABLE Transaction (
    transaction_id INT PRIMARY KEY AUTO_INCREMENT,
    listing_id INT NOT NULL,
    buyer_id INT NOT NULL,
    quantity_bought DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    transaction_date DATE NOT NULL,
    FOREIGN KEY (listing_id) REFERENCES CropListing(listing_id),
    FOREIGN KEY (buyer_id) REFERENCES Buyer(buyer_id)
);
CREATE TABLE DistrictClimate (
    climate_id INT PRIMARY KEY AUTO_INCREMENT,
    district VARCHAR(50) NOT NULL,
    record_date DATE NOT NULL,
    rainfall_mm DECIMAL(6,2),
    temperature_c DECIMAL(4,2),
    humidity DECIMAL(5,2),
    soil_ph DECIMAL(3,2),
    moisture DECIMAL(5,2),
    UNIQUE (district, record_date)
);
CREATE TABLE ClimateRisk (
    risk_id INT PRIMARY KEY AUTO_INCREMENT,
    district VARCHAR(50) NOT NULL,
    risk_score INT NOT NULL,
    risk_level ENUM('Low','Medium','High') NOT NULL,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE YieldHistory (
    yield_id INT PRIMARY KEY AUTO_INCREMENT,
    farmer_id INT NOT NULL,
    crop_id INT NOT NULL,
    year INT NOT NULL,
    month INT NOT NULL,
    total_yield_kg DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES Farmer(farmer_id),
    FOREIGN KEY (crop_id) REFERENCES Crop(crop_id),
    UNIQUE (farmer_id, crop_id, year, month)
);
CREATE TABLE DiseaseReport (
    report_id INT PRIMARY KEY AUTO_INCREMENT,
    farmer_id INT NOT NULL,
    crop_id INT NOT NULL,
    disease_name VARCHAR(100) NOT NULL,
    severity INT NOT NULL CHECK (severity BETWEEN 1 AND 10),
    notes VARCHAR(255),
    report_date DATE NOT NULL,
    district VARCHAR(50) NOT NULL,
    FOREIGN KEY (farmer_id) REFERENCES Farmer(farmer_id),
    FOREIGN KEY (crop_id) REFERENCES Crop(crop_id)
);
CREATE TABLE Alert (
    alert_id INT PRIMARY KEY AUTO_INCREMENT,
    alert_type ENUM('Disease','Climate','Price','Marketplace') NOT NULL,
    district VARCHAR(50),
    message VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE
);
USE cropverse;
DELIMITER $$

CREATE TRIGGER trg_disease_severe_alert
AFTER INSERT ON DiseaseReport
FOR EACH ROW
BEGIN
    IF NEW.severity >= 8 THEN
        INSERT INTO Alert(alert_type, district, message)
        VALUES (
            'Disease',
            NEW.district,
            CONCAT('Severe disease reported: ', NEW.disease_name, ' (Severity ', NEW.severity, '). Stay alert!')
        );
    END IF;
END$$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE sp_yield_insight (
    IN p_farmer_id INT,
    IN p_crop_id INT
)
BEGIN
    DECLARE avg_yield DECIMAL(10,2);

    SELECT AVG(total_yield_kg)
    INTO avg_yield
    FROM YieldHistory
    WHERE farmer_id = p_farmer_id AND crop_id = p_crop_id;

    SELECT
        avg_yield AS average_yield_kg,
        CASE
            WHEN avg_yield IS NULL THEN 'No Data'
            WHEN avg_yield >= 1000 THEN 'High'
            WHEN avg_yield >= 500 THEN 'Medium'
            ELSE 'Low'
        END AS expected_yield_level;
END$$

DELIMITER ;



-- sample farmer/buyer/crop
INSERT INTO Farmer(name, phone, district) VALUES ('Rahim', '01700000000', 'Dhaka');
INSERT INTO Buyer(name, phone) VALUES ('Karim Traders', '01800000000');
INSERT INTO Crop(crop_name, category) VALUES ('Rice', 'Grain');

-- listing
INSERT INTO CropListing(farmer_id, crop_id, quantity_kg, price_per_kg, listed_at)
VALUES (1, 1, 50, 55, CURDATE());

-- yield history
INSERT INTO YieldHistory(farmer_id, crop_id, year, month, total_yield_kg)
VALUES (1, 1, 2025, 10, 900),
       (1, 1, 2025, 11, 1100);

-- severe disease report (should create alert automatically)
INSERT INTO DiseaseReport(farmer_id, crop_id, disease_name, severity, notes, report_date, district)
VALUES (1, 1, 'Leaf Blight', 9, 'Spreading fast', CURDATE(), 'Dhaka');

SELECT * FROM Alert ORDER BY created_at DESC;

INSERT INTO Transaction(listing_id, buyer_id, quantity_bought, total_price, transaction_date)
VALUES (1, 1, 50, 2750, CURDATE());

SELECT listing_id, quantity_kg, status FROM CropListing WHERE listing_id=1;

SELECT * FROM Alert ORDER BY created_at DESC;

USE cropverse;
SELECT crop_id, crop_name FROM Crop;
INSERT INTO Crop (crop_name, category) VALUES
('Rice', 'Grain'),
('Potato', 'Vegetable'),
('Tomato', 'Vegetable'),
('Wheat', 'Grain');
SELECT crop_id, crop_name FROM Crop;
USE cropverse;

SELECT listing_id, farmer_id, crop_id, quantity_kg, price_per_kg, status, listed_at
FROM CropListing
ORDER BY listing_id DESC
LIMIT 10;







