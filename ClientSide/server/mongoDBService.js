const mongoose = require('mongoose');

// Correct connection string with the database name included
const uri = "mongodb+srv://ninjaBroadcast:uLv8vKDHER6CvHG8@cluster0.khjrocu.mongodb.net/NinjaTraderApp";

// Connect to MongoDB
mongoose.connect(uri)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
        console.error("Could not connect to MongoDB:");
        console.error("Error name: ", err.name);
        console.error("Error message: ", err.message);
        console.error("Error stack: ", err.stack);
    })
    ;

//console.log('Attempting to connect to MongoDB...');

// Define the schema for the MAC addresses
const macAddressSchema = new mongoose.Schema({
    // Add fields as they appear in your MongoDB documents
    name: String, // Optional: Add if your documents have a 'name' field
    mac_address: String // Assuming there is a 'mac_address' field in your documents
});

// Create the model from the schema. Ensure the collection name is exactly as in MongoDB
const MacAddress = mongoose.model('MacAddress', macAddressSchema, 'mac_addresses');

// Function to fetch MAC addresses
function fetchMacAddresses() {
    MacAddress.find({})
        .then(macAddresses => {
            //console.log('MAC addresses:', macAddresses);
        })
        .catch(err => {
            console.error('Error fetching MAC addresses:', err);
        });
}
async function checkMacAddressExists(inputMacAddress) {
    try {
        
        const result = await MacAddress.findOne({
            $or: [
                { mac1: inputMacAddress },
                { mac2: inputMacAddress }
            ]
        });

        if (result) {
            console.log(`MAC address ${inputMacAddress} exists in the database.`);
            return true;  
        } else {
            console.log(`MAC address ${inputMacAddress} does not exist in the database.`);
            return false;  
        }
    } catch (err) {
        console.error('Error checking MAC address:', err);
        return false;  
    }
}


fetchMacAddresses();
checkMacAddressExists('00:50:56:3f:ee:07');

module.exports = { fetchMacAddresses, checkMacAddressExists };