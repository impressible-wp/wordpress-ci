--
-- A dummy SQL file for testing purposes.
--

CREATE TABLE `wp_dummy` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `wp_dummy` (`name`) VALUES
('Example 1'),
('Example 2'),
('Example 3');
