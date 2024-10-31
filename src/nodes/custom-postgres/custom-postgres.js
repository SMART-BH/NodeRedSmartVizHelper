// Import required libraries
const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

module.exports = function(RED) {
    function CustomPostgresNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        // Set up PostgreSQL configuration from environment variables or defaults
        const pgConfig = {
            host: process.env.PG_HOST || 'localhost',
            port: process.env.PG_PORT || 5432,
            user: process.env.PG_USER || 'postgres',
            password: process.env.PG_PASSWORD || 'password',
            database: process.env.PG_DB || 'my_database',
            ssl: true,
            max: 10,
            idleTimeoutMillis: 30000   
        };

        // Handle incoming messages
        node.on('input', async function(msg, send, done) {
            // Set up PostgreSQL client
            const client = new Client(pgConfig);

            try {
                await client.connect(); // Connect to the database

                // Use msg.payload.query as the SQL query (make sure to sanitize it in production)
                const result = await client.query(msg.payload.query, msg.payload.values || []);

                // Return query results in msg.payload
                msg.payload = result.rows;

                send(msg); // Send the result to the next node in the flow
            } catch (error) {
                node.error("PostgreSQL query error: " + error);
                msg.payload = { error: error.message };
                send(msg);
            } finally {
                await client.end(); // Ensure the connection is closed after query execution
            }

            done();
        });
    }

    // Register the node with Node-RED
    RED.nodes.registerType("custom-postgres", CustomPostgresNode);
};