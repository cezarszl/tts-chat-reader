import express from 'express';
import cors from 'cors';
import routes from './routes';
import './whatsapp';

const app = express();
const port = process.env.BACKEND_PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api', routes);

app.get('/ping', (req, res) => {
    res.json({ message: 'pong' });
});

app.listen(port, () => {
    console.log(`🚀 Backend running at http://localhost:${port}`);
});
