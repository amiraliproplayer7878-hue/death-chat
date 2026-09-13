const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// ⚠️ پسورد جدید Atlas رو اینجا بذار
const MONGO_URI = 'mongodb+srv://amiraliproplayer7878_db_user:fxB4u8YzJAj3g8Sv@cluster0.xj2x2hk.mongodb.net/deathpanel?';

// اکانت‌ها رو اینجا بساز، هرچقدر دلت بخواد:
const accounts = [
    { username: 'MrDeath',    password: 'amirali123',   role: 'owner'  },
    { username: 'panda',    password: 'mmadtreiakesh',  role: 'Member'   },
    { username: 'arad',    password: 'aradhacker',  role: 'Member'   },
    { username: 'reza',     password: 'reza@1234',  role: 'Member'    },
    // { username: 'x', password: 'y', role: 'user' },  ← به همین راحتی اضافه کن
];

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('☠️ SUCCESS: Connected to MongoDB Atlas!');

        for (const acc of accounts) {
            const exists = await User.findOne({ username: acc.username });
            if (exists) {
                console.log(`⚠️  Skip: "${acc.username}" قبلاً وجود داره.`);
                continue;
            }

            const hashedPassword = await bcrypt.hash(acc.password, 10);
            await User.create({
                username: acc.username,
                password: hashedPassword,
                role: acc.role
            });

            console.log(`✅ اکانت ساخته شد → یوزرنیم: ${acc.username} | پسورد: ${acc.password} | رول: ${acc.role}`);
        }

        console.log('\n👑 تمام شد! اکانت‌ها آماده‌ست، بفرست برای دوستات 🎁');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error during seeding:', err);
        process.exit(1);
    }
}

seed();
