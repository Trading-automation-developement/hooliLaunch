import React, {useState, useEffect} from 'react';
import io from 'socket.io-client'; 
import Select from "react-select";

// storing socket connection in this global variable
let socket = null;
let socketRemoteServer = null;


function App() {
  let count=0;

  const [list, setlist]=useState(["Bar","Sim101"], ["Omer","Sim102"]); 

  var trader="";
  const [destination, setDestination] = useState(""); 
  //const [trader, setTrader] = useState(""); 
 const [allDestinations, setAllDestinationsData]=useState([]); 
  const [allDestinations2, setAllDestination2sData]=useState({}); 

  const options = [
    { value: 'Bar', label: 'Bar' },
    { value: 'Omer', label: 'Omer' },
  ]
  
  // after component mount...
  useEffect(() => {
    // connect to the socket server
    socket = io("ws://127.0.0.1:2222");
    socketRemoteServer = io('http://83.229.81.169:2666');//3001
    
    socketRemoteServer.on('NewTrade', (data) => {
      
      console.log("File changed in Server ", data)  
      socket.emit('TradeNow', data);

  },[list]);

    socket.on('SendAllData', (AllData) => {
      //setAllDestinationsData(AllData.destinations);
      console.log("SendAllData", AllData)
      // setDestination(AllData.destinations[0])   
      // trader=AllData.trader1
      setlist(AllData)
    });
    
  }, []);

  const handleAddAccount = async(value)=>{
    //setAllDestinationsData([...allDestinations,destination ])
    console.log("handleAddAccount",destination, trader)
    list.push([trader,destination])
    // var new_dict = {...allDestinations2};
    // new_dict[trader]=destination

    // setAllDestination2sData(new_dict)
    console.log(list) 
    socket.emit('AddDestination', destination, trader);
  }
  
  const handleDeleteAccount=async(row)=>{
    console.log("handleDeleteAccount",row);
    setlist( list.filter(item => !(item[0] === row[0] && item[1] === row[1])));
    console.log("list:",list);

    //setAllDestinationsData(newArray); // Updates the state with the new array
    socket.emit('DeleteDestination', row);
  }

  const handleTrader=async(row)=>{
    console.log(row, trader);
    trader=row;
    console.log(trader);

  }


  return (
    
    <div className="table-container">
    <h1>Client Interface - put our destinations</h1>
    <table className="table">
      <thead>
        <tr>
          <th>Account</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {list.map(row => (
          
          <tr key={row}>
            <td>{row}</td>
            <td>
              <button onClick={() => handleDeleteAccount(row)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    <div>
      <input
        type="text"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        placeholder="Enter destintion name"
      />
        <Select  onChange={(e) =>handleTrader(e.value)}

        options={options}
        style={{width:  'fit-content'}}            

      />

      <button onClick={handleAddAccount}>Add Account</button>
    </div>
  </div>
  );
}

export default App;
