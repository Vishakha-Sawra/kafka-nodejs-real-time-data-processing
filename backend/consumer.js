const { Kafka, logLevel } = require('kafkajs');
const mysql = require('mysql2');

// Create MySQL connection pool
const pool = mysql.createPool({
  connectionLimit: 10,
  host: '127.0.0.1',
  user: 'root',
  password: 'password',
  database: 'rail_data',
});

// Configuration for the Kafka brokers
const kafkaConfig = {
  brokers: ["<ip-address>:9092"],
  logLevel: logLevel.DEBUG, // Set log level to DEBUG for detailed logging
};

// Create Kafka consumer
const kafkaConsumer = new Kafka({
  clientId: "rail_app_consumer",
  ...kafkaConfig,
}).consumer({
  groupId: "rail_consumer_group",
});

// Topics produced by the producer
const topics = ["train_activation", "train_cancellation"];

// Connect the Kafka consumer 
const initKafkaConsumer = async () => {
  await kafkaConsumer.connect();
  await kafkaConsumer.subscribe({ topics });

  await kafkaConsumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const processedMessage = JSON.parse(message.value.toString('utf-8'));

        // Log the received message
        console.log(processedMessage);

        // Insert data into MySQL database
        if (topic === 'train_activation') {
          insertActiveTrain(processedMessage.trainId, processedMessage.stanox, processedMessage.timestamp);
        } else if (topic === 'train_cancellation') {
          insertCancelledTrain(processedMessage.trainId, processedMessage.stanox, processedMessage.reasonCode, processedMessage.timestamp);
        }

        // Add your processing logic here
        // For now, let's log that the message is being processed
        console.log('Processing message...');
      } catch (error) {
        console.error('Error processing message:', error.message);
      }
    },
  });
};

// Function to format timestamp to MySQL DATETIME format
function formatTimestampToMySQL(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = (`0${date.getMonth() + 1}`).slice(-2);
  const day = (`0${date.getDate()}`).slice(-2);
  const hours = (`0${date.getHours()}`).slice(-2);
  const minutes = (`0${date.getMinutes()}`).slice(-2);
  const seconds = (`0${date.getSeconds()}`).slice(-2);
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Function to insert active train data into the database
function insertActiveTrain(trainId, stanox, timestamp) {
  const formattedTimestamp = formatTimestampToMySQL(timestamp);
  const sql = 'INSERT INTO active_trains (train_id, stanox, timestamp) VALUES (?, ?, ?)';
  const values = [trainId, stanox, formattedTimestamp];

  pool.query(sql, values, (error, results) => {
    if (error) {
      console.error('Error inserting active train data:', error);
    } else {
      console.log('Inserted active train data:', results);
    }
  });
}

// Function to insert cancelled train data into the database
function insertCancelledTrain(trainId, stanox, reasonCode, timestamp) {
  const formattedTimestamp = formatTimestampToMySQL(timestamp);
  const sql = 'INSERT INTO cancelled_trains (train_id, stanox, reason_code, timestamp) VALUES (?, ?, ?, ?)';
  const values = [trainId, stanox, reasonCode, formattedTimestamp];

  pool.query(sql, values, (error, results) => {
    if (error) {
      console.error('Error inserting cancelled train data:', error);
    } else {
      console.log('Inserted cancelled train data:', results);
    }
  });
}

// Initialize Kafka consumer
initKafkaConsumer();

// Handle process termination to close the Kafka consumer gracefully
process.on('SIGTERM', async () => {
  await kafkaConsumer.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await kafkaConsumer.disconnect();
  process.exit(0);
});
