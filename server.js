const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

// MongoDB setup
const DB =
  process.env.NODE_ENV == 'production'
    ? process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)
    : process.env.DATABASE_DEV.replace(
      '<PASSWORD>',
      process.env.DATABASE_PASSWORD
    );

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('DB Connection Successful');
  });

const port = process.env.PORT || 4020;
const server = app.listen(port, () => {
  console.log(`App running on port ${port} ...`);
});

// Socket.io
const io = require('socket.io')(server);

io.on('connection', (socket) => {
  console.log('We have a new connection!');

  // Listen for joins
  socket.on('join', (room) => {
    console.log(`Socket ${socket.id} joining ${room}`);
    socket.join(room);
  });

  // Listen for sounds
  socket.on('sound', (id) => {
    // console.log(id);
    socket.broadcast.emit('sound', id);
  });


  // Listen for emojis
  socket.on('emoji', ({ emojiId, emojiNative }) => {
    // console.log(emojiId);
    // console.log(emojiNative)
    socket.broadcast.emit('emoji', { emojiId, emojiNative });
  });

  socket.on('disconnect', () => {
    console.log('User has left');
  });

  socket.on('error', (error) => {
    console.log(error)
  })
});

app.set('socketio', io);

// Errors
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM RECIEVED 💥 Shutting down gracefully...');
  server.close(() => {
    console.log(`💥 process terminated...`);
  });
});

// /Users/huntergarrett/mongodb/bin/mongod --dbpath=/Users/huntergarrett/mongodb-data
// sudo killall mongod
