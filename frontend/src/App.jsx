import React from 'react';
import CancelledTrainsList from './CancelledTrainsList';
import ActiveTrainsList from './ActiveTrainsList';

const App = () => {
  return (
    <div>
      <h1>Cancelled Trains</h1>
      <CancelledTrainsList apiUrl="http://localhost:8080/api/cancelled-trains" limit={10} />

      <h1>Active Trains</h1>
      <ActiveTrainsList apiUrl="http://localhost:8080/api/active-trains" limit={10} />
    </div>
  );
};

export default App;
