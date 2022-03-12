require('dotenv').config()

const mongoose = require('mongoose');
require('./models/tracker_state');
require('./models/event_deadletter_queue');

const TRACKER_STATE = require('./models/tracker_state');
const TrackerState = mongoose.model('TRACKER_STATE', TRACKER_STATE);
const processMarketplaceEvents = require('./services/marketplacetracker')


const connect = () => {
  const uri = process.env.DB_URL
  mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  const db = mongoose.connection

  db.on('error', console.error.bind(console, 'connection error:'))
  db.once('open', async () => {
    // Check last block processed;
    const result = await TrackerState.find({ contractAddress: process.env.CONTRACTADDRESS });
    if (!result.length) {
      await TrackerState.create({ contractAddress: process.env.CONTRACTADDRESS, lastBlockProcessed: 0 });
    }

    const trackContractCallback = async (firstrun) => {
      const lastBlockRecord = await TrackerState.find({ contractAddress: process.env.CONTRACTADDRESS });
      if (firstrun)
      {
        await processMarketplaceEvents(lastBlockRecord[0].lastBlockProcessed-1000);
      }
      else
      {
        await processMarketplaceEvents(lastBlockRecord[0].lastBlockProcessed);
      }
      setTimeout(() => trackContractCallback(false), 5000);
    }
    await trackContractCallback(true);
  })
}

process.on('unhandledRejection', (err) => {
  console.error(err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error(err);
  process.exit(1);
});


connect();
