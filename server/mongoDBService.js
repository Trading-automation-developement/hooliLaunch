const mongoose = require('mongoose');

const uri = "mongodb+srv://ninjaBroadcast:uLv8vKDHER6CvHG8@cluster0.khjrocu.mongodb.net/hooli_project";

// Connect to MongoDB
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
        console.error("Could not connect to MongoDB:");
        console.error("Error name: ", err.name);
        console.error("Error message: ", err.message);
        console.error("Error stack: ", err.stack);
    });

console.log('Attempting to connect to MongoDB...');

const macAddressSchema = new mongoose.Schema({
    name: String, 
    mac_address: String 
});

const MacAddress = mongoose.model('MacAddress', macAddressSchema, 'mac_addresses');

function fetchMacAddresses() {
    MacAddress.find({})
        .then(macAddresses => {
            console.log('MAC addresses:', macAddresses);
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