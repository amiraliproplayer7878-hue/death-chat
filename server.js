const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt');
const User = require('./models/User'); // فرض بر اینه مدل User رو داری
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// اتصال به دیتابیس اطلس
const MONGO_URI = 'mongodb+srv://amiraliproplayer7878_db_user:fxB4u8YzJAj3g8Sv@cluster0.xj2x2hk.mongodb.net/deathpanel?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(MONGO_URI)
    .then(() => console.log('💀 Connected to MongoDB Atlas'))
    .catch(err => console.error(err));

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// تنظیمات Session
app.use(session({
    secret: 'death_secret_key_1388',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 روز
}));

// مسیر صفحه لاگین (GET)
app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// پردازش لاگین (POST)
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.render('login', { error: 'کاربری با این مشخصات پیدا نشد!' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('login', { error: 'رمز عبور اشتباه است!' });
        }

        // ذخیره اطلاعات کاربر در سشن
        req.session.user = { id: user._id, username: user.username, role: user.role };
        res.redirect('/chat');
    } catch (err) {
        console.log(err);
        res.render('login', { error: 'خطای سرور!' });
    }
});

// محافظت از صفحه چت (فقط کاربران لاگین‌کرده)
app.get('/chat', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    const messages = await Message.find().sort({ createdAt: 1 }).limit(100);
    res.render('chat', { user: req.session.user, messages });
});

// خروج از حساب
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// مدیریت سوکت‌ها (رای‌تایم)
io.on('connection', (socket) => {
    console.log('⚡ یک کاربر به چت متصل شد');

    // ارسال پیام جدید (با قابلیت ریپلای)
    socket.on('chat message', async (data) => {
        const newMessage = new Message({
            sender: data.sender,
            message: data.message,
            replyTo: data.replyTo || null
        });
        await newMessage.save();

        io.emit('chat message', newMessage);
    });

    // ویرایش پیام
    socket.on('edit message', async (data) => {
        try {
            const updatedMsg = await Message.findByIdAndUpdate(
                data.id,
                { message: data.newMessage, isEdited: true },
                { new: true }
            );
            if (updatedMsg) {
                io.emit('message edited', updatedMsg);
            }
        } catch (err) {
            console.log(err);
        }
    });

    socket.on('disconnect', () => {
        console.log('❌ کاربر قطع شد');
    });
});

// رویداد حذف پیام
io.on('connection', (socket) => { // <--- این خط خیلی مهمه!
    console.log('A user connected:', socket.id);

    // کدهای بقیه سوکت‌ها اینجا باشن (مثل send message)

    // ✅ کدی که ارور داده رو ببر اینجا (داخل این بلوک)
    socket.on('delete message', async (msgId) => {
        try {
            // منطق حذف از دیتابیس
            await Message.findByIdAndDelete(msgId);
            
            // خبر دادن به بقیه کاربران که پیام حذف شده
            io.emit('message deleted', msgId); 
            
            console.log(`🗑 Message ${msgId} deleted.`);
        } catch (err) {
            console.error('Error deleting message:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });

    // توی server.js داخل io.on('connection', (socket) => { ... })
socket.on('delete message', async (messageId) => {
    // ۱. باید بفهمی کی داره این پیام رو پاک می‌کنه (اطلاعات یوزر توی socket.user هست)
    if (socket.user.role === 'owner' || socket.user.role === 'mod') {
        // ۲. پیام رو از دیتابیس پاک کن
        await Message.findByIdAndDelete(messageId);
        // ۳. به همه بگو پیام حذف شد که از صفحه بقیه هم پاک بشه
        io.emit('message deleted', messageId);
    } else {
        socket.emit('error', 'شما اجازه حذف پیام را ندارید!');
    }
  });

    });


server.listen(3000, () => {
    console.log('🚀 Server is running on http://localhost:3000/login');
});
