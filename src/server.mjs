import express from 'express';
import jwt from 'jsonwebtoken';
import pg from 'pg';
import cors from 'cors'; 

const app = express();
const port = 3050;

// PostgreSQL connection
const { Pool } = pg;
const pool = new Pool({
  user: 'username',
  host: 'localhost',
  database: 'library',
  password: 'password',
  port: 5432,
});

// database hardcoded
const users = [
  { id: 1, username: 'mike', libraryId: 'BK1' },
  { id: 2, username: 'john', libraryId: 'BK1' },
  { id: 3, username: 'peter', libraryId: 'BK2' },
];

const bookshelves = [
  { id: 1, userId: 1, bookName: 'Book1', note: 'Note1', order: 1 },
  { id: 2, userId: 1, bookName: 'Book2', note: 'Note2', order: 2 },
  { id: 3, userId: 2, bookName: 'Book3', note: 'Note3', order: 1 },
];

app.use(express.json());
app.use(cors()); //  cors middleware


// User Login
app.post('/login', (req, res) => {
  const { username } = req.body;

  const user = users.find((u) => u.username === username);

  if (!user) {
    return res.status(401).json({ message: 'Invalid username' });
  }

  const token = jwt.sign({ userId: user.id }, 'secretKey'); // secret key

  res.json({ token });
});


// User Authorization Middleware
app.use((req, res, next) => {
  const token = req.header('Authorization');
  if (!token) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, 'secretKey');
    const user = users.find((u) => u.id === decoded.userId);
    if (!user) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
});


// Bookshelf Syncing
app.get('/bookshelves', (req, res) => {
  const user = req.user;
  const userBookshelf = bookshelves.filter((b) => b.userId === user.id);
  const sameLibraryBookshelves = bookshelves.filter(
    (b) => users.find((u) => u.id === b.userId)?.libraryId === user.libraryId
  );

  res.json({
    myBookshelf: userBookshelf,
    sameLibraryBookshelves,
  });
});



app.put('/bookshelves/:id', (req, res) => {
  const { id } = req.params;
  const { bookName, note, order } = req.body;
  const user = req.user;

  const bookshelf = bookshelves.find(
    (b) => b.id === parseInt(id) && b.userId === user.id
  );

  if (!bookshelf) {
    return res.status(404).json({ message: 'Bookshelf not found' });
  }

  // Update Bookshelf properties
  bookshelf.bookName = bookName;
  bookshelf.note = note;
  bookshelf.order = order;

  res.json({ message: 'Bookshelf updated successfully', bookshelf });
});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
