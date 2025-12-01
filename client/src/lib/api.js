import axios from 'axios';

const api = axios.create({
    // change to production backend url
    baseURL: 'http://localhost:5000',
    headers: {
        'Content-Type':'application/json',
    }
})
export default api;