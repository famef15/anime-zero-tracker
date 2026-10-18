# Anime Zero Tracker // Live Combat HUD & Inventory Tracker

ระบบติดตามดรอป, คลังวัตถุดิบ, อุปกรณ์ และสถิติการเล่น Anime Zero แบบเรียลไทม์ พร้อมหน้าจอ Dark Mode + Game GUI HUD

---

## โครงสร้างไฟล์ในโปรเจกต์
- `server.mjs`: เซิร์ฟเวอร์ Node.js (Zero Dependencies ใช้โมดูลมาตรฐานทั้งหมด)
- `index.html`: หน้าแดชบอร์ด Game GUI HUD (Dark Mode, เวกเตอร์ไอคอน, Responsive มือถือ 100%)
- `icons/`: โฟลเดอร์รวมไฟล์ภาพ Texture จริงจากเกมแบบโปร่งใส (PNG 32-bit RGBA)
- `icons_map.json`: แผนผังจับคู่ชื่อไอเทมกับไฟล์ไอคอน
- `data.json`: ฐานข้อมูลสถานะตัวละคร, เลเวล, EXP, กระเป๋าเงิน, และของดรอป
- `tracker-client.luau`: สคริปต์ Luau สำหรับรันใน Roblox Client (Executor) เพื่อส่งข้อมูลขึ้น Cloud
- `Dockerfile`: ไฟล์สำหรับ Deploy ผ่าน Docker หรือคลาวด์คอนเทนเนอร์
- `package.json`: การตั้งค่า Node.js App

---

## วิธีการ Deploy ขึ้น Cloud

### ตัวเลือกที่ 1: Deploy บน Render.com (ฟรี & สะดวกสุด)
1. อัปโหลดโฟลเดอร์นี้ขึ้น **GitHub Repository**
2. ไปที่ [Render.com](https://render.com) แล้วเลือก **New Web Service**
3. เชื่อมต่อกับ GitHub Repo ของคุณ
4. ตั้งค่า:
   - **Runtime**: `Node`
   - **Build Command**: `npm install` (หรือเว้นว่างไว้)
   - **Start Command**: `node server.mjs`
5. กด **Deploy Web Service**
6. เมื่อ Deploy เสร็จ คุณจะได้ URL สาธารณะ เช่น: `https://anime-zero-tracker.onrender.com`

---

### ตัวเลือกที่ 2: Deploy บน Railway.app
1. ลากโฟลเดอร์โปรเจกต์ หรือ Import จาก GitHub เข้า [Railway.app](https://railway.app)
2. Railway จะตรวจจับ `package.json` หรือ `Dockerfile` และทำการรัน `node server.mjs` อัตโนมัติ
3. ไปที่แท็บ **Settings** -> กด **Generate Domain** เพื่อรับ URL ใช้งาน

---

### ตัวเลือกที่ 3: รันบน VPS (Ubuntu / Debian / Linux)
```bash
# 1. ติดตั้ง Node.js (v18+)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. เข้าโฟลเดอร์โปรเจกต์
cd anime-zero-tracker-upload

# 3. รันผ่าน PM2 เพื่อให้อยู่ใน Background ตลอดเวลา
sudo npm install -g pm2
pm2 start server.mjs --name "anime-tracker"
pm2 save
pm2 startup
```

---

## การเชื่อมต่อ Roblox Client กับ Cloud Server
1. เปิดไฟล์ `tracker-client.luau`
2. บรรทัดที่ 6 เปลี่ยน `SERVER_URL` เป็น URL Cloud ของคุณ:
   ```lua
   local SERVER_URL = "https://your-cloud-url.onrender.com"
   ```
3. นำโค้ดใน `tracker-client.luau` ไปวางใน Executor (เช่น Solara, Wave, Delta, Hydrogen) หรือใส่ไว้ในโฟลเดอร์ `autoexec`
4. เมื่อคุณเล่นเกม ข้อมูลจะถูกซิงค์ขึ้น Cloud อัตโนมัติทุก 8 วินาที และซิงค์ทันทีเมื่อจบด่าน!

---

## ตัวแปรสภาพแวดล้อม (Environment Variables) - ไม่บังคับ
- `PORT`: พอร์ตของเซิร์ฟเวอร์ (Cloud ส่วนใหญ่จะกำหนดให้อัตโนมัติ)
- `DASHBOARD_PIN`: รหัส PIN เพื่อล็อกไม่ให้คนอื่นเข้าดูแดชบอร์ด (เช่น `1234`)
- `TRACKER_SECRET`: คีย์ลับเพื่อป้องกันไม่ให้คนอื่นยิงสแปมเข้า API รายงานผล
