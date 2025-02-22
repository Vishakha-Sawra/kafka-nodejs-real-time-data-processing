const { Kafka } = require('kafkajs');
const stompit = require('stompit');
const async = require('async');

// Configuration for the Kafka brokers
const kafkaConfig = {
    brokers: ["<ip-address>:9092"],
};

// Create Kafka producer
const kafkaProducer = new Kafka({
    clientId: "rail_app_producer",
    ...kafkaConfig,
}).producer();

const initKafkaProducer = async () => {
    try {
        await kafkaProducer.connect();
        console.log('Producer connected successfully');
    } catch (error) {
        console.error('Error connecting Kafka producer:', error.message);
        process.exit(1); // Exit the process if unable to connect
    }
};

// Initialize Kafka producer
initKafkaProducer();

const connectOptions = { // Configuration for the STOMP connection to the Network Rail feed
    host: 'publicdatafeeds.networkrail.co.uk',
    port: 61618,
    connectHeaders: {
        'heart-beat': '15000,15000',
        'client-id': '',
        'host': '/',
        'login': '<your-username>',
        'passcode': '<your-password>'
    }
};

const reconnectOptions = {
    initialReconnectDelay: 10,
    maxReconnectDelay: 30000,
    useExponentialBackOff: true,
    maxReconnects: 30,
    randomize: false
};

const connectionManager = new stompit.ConnectFailover([connectOptions], reconnectOptions);

connectionManager.connect((error, client, reconnect) => {
    if (error) {
        console.error('Terminal error, gave up reconnecting:', error.message);
        return;
    }

    client.on('error', (error) => {
        console.error('Connection lost. Reconnecting...', error.message);
        reconnect();
    });

    const headers = {
        destination: '/topic/TRAIN_MVT_ALL_TOC',
        'activemq.subscriptionName': 'somename-train_mvt',
        ack: 'client-individual'
    };

    client.subscribe(headers, (error, message) => {
        if (error) {
            console.error('Subscription failed:', error.message);
            return;
        }

        message.readString('utf-8', async (error, body) => {
            if (error) {
                console.error('Failed to read a message', error.message);
                return;
            }

            if (body) {
                try {
                    const data = JSON.parse(body);

                    async.each(data, async (item) => {
                        const timestamp = new Date().toISOString();

                        if (item.header) {
                            if (item.header.msg_type === '0001') {
                                // Train Activation
                                const stanox = item.body.tp_origin_stanox || item.body.sched_origin_stanox || 'N/A';
                                console.log(timestamp, '- Train', item.body.train_id, 'activated at stanox', stanox);

                                // Send the message to Kafka
                                await sendToKafka('train_activation', { timestamp, trainId: item.body.train_id, stanox });
                            } else if (item.header.msg_type === '0002') {
                                // Train Cancellation
                                const stanox = item.body.loc_stanox || 'N/A';
                                const reasonCode = item.body.canx_reason_code || 'N/A';
                                console.log(timestamp, '- Train', item.body.train_id, 'cancelled. Cancellation Reason:', reasonCode, 'at stanox', stanox);

                                // Send the message to Kafka
                                await sendToKafka('train_cancellation', { timestamp, trainId: item.body.train_id, stanox, reasonCode });
                            }
                        }
                    });
                } catch (e) {
                    console.error('Failed to parse JSON', e.message);
                }
            }

            client.ack(message);
        });
    });
});

// Add a log statement inside sendToKafka to confirm messages are being sent
async function sendToKafka(topic, message) {
    try {
        await kafkaProducer.send({
            topic,
            messages: [
                {
                    value: JSON.stringify(message),
                },
            ],
        });
        console.log(`Message sent to Kafka topic "${topic}":`, message); // Log confirmation
    } catch (error) {
        console.error('Error sending message to Kafka:', error.message);
    }
}
