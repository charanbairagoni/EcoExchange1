"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = require("crypto");
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || 'ecoexchange-dev-secret';
const SELLER_COMMISSION_RATE = Number(process.env.SELLER_COMMISSION_RATE || 0.02);
const BUYER_COMMISSION_RATE = Number(process.env.BUYER_COMMISSION_RATE || 0.05);
const TRANSPORT_CHARGE = Number(process.env.TRANSPORT_CHARGE || 5000);
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
const DATA_PATH = process.env.VERCEL
    ? path_1.default.resolve('/tmp', 'store.json')
    : path_1.default.resolve(__dirname, '../data/store.json');
const demoUsers = [
    {
        id: 'user-abc',
        industryName: 'ABC Manufacturing',
        ownerName: 'Rohit Sharma',
        email: 'seller@abc.com',
        location: 'Pune',
        contactNumber: '+91 98765 43210',
        passwordHash: bcryptjs_1.default.hashSync('Password123', 10),
        roles: ['SELLER', 'BUYER'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'user-greensteel',
        industryName: 'GreenSteel Industries',
        ownerName: 'Aisha Naidu',
        email: 'buyer@greensteel.com',
        location: 'Mumbai',
        contactNumber: '+91 99887 66554',
        passwordHash: bcryptjs_1.default.hashSync('Password123', 10),
        roles: ['BUYER', 'SELLER'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'user-ecoplast',
        industryName: 'EcoPlast Solutions',
        ownerName: 'Naveen Iyer',
        email: 'sales@ecoplast.com',
        location: 'Bengaluru',
        contactNumber: '+91 98111 22233',
        passwordHash: bcryptjs_1.default.hashSync('Password123', 10),
        roles: ['SELLER'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];
const demoListings = [
    {
        id: 'listing-1',
        wasteType: 'Steel Scrap',
        quantity: 1200,
        unit: 'kg',
        price: 95000,
        location: 'Pune',
        description: 'High-grade steel scrap suitable for re-melting and industrial reuse.',
        imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee2279d0d3a8?auto=format&fit=crop&w=900&q=80',
        sellerId: 'user-abc',
        availability: 'Available',
        status: 'LISTED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'listing-2',
        wasteType: 'Plastic Scrap',
        quantity: 900,
        unit: 'kg',
        price: 62000,
        location: 'Bengaluru',
        description: 'Clean HDPE and LDPE polymer waste sorted by grade.',
        imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=900&q=80',
        sellerId: 'user-ecoplast',
        availability: 'Available',
        status: 'LISTED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'listing-3',
        wasteType: 'Fly Ash',
        quantity: 5,
        unit: 'tonnes',
        price: 150000,
        location: 'Nagpur',
        description: 'Ash by-product with consistent density for construction and filler use.',
        imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=80',
        sellerId: 'user-abc',
        availability: 'Available',
        status: 'LISTED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];
const demoLogisticsCompanies = [
    {
        id: 'logistics-1',
        companyName: 'ABC Logistics',
        contactNumber: '+91 90123 45678',
        serviceArea: 'Pune, Mumbai',
        status: 'Active',
        createdAt: new Date().toISOString(),
    },
    {
        id: 'logistics-2',
        companyName: 'GreenMove Transport',
        contactNumber: '+91 91234 56789',
        serviceArea: 'Bengaluru, Chennai',
        status: 'Active',
        createdAt: new Date().toISOString(),
    },
    {
        id: 'logistics-3',
        companyName: 'EcoCargo',
        contactNumber: '+91 92345 67890',
        serviceArea: 'Hyderabad, Nagpur',
        status: 'Active',
        createdAt: new Date().toISOString(),
    },
];
const defaultStore = {
    users: demoUsers,
    wasteListings: demoListings,
    orders: [],
    logisticsCompanies: demoLogisticsCompanies,
    logisticsRequests: [],
    transactions: [],
    conversations: [],
    messages: [],
};
function ensureStoreFile() {
    const dir = path_1.default.dirname(DATA_PATH);
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
    if (!fs_1.default.existsSync(DATA_PATH)) {
        const seedPath = path_1.default.resolve(__dirname, '../data/store.json');
        if (fs_1.default.existsSync(seedPath)) {
            fs_1.default.copyFileSync(seedPath, DATA_PATH);
        }
        else {
            fs_1.default.writeFileSync(DATA_PATH, JSON.stringify(defaultStore, null, 2), 'utf-8');
        }
    }
}
function normalizeDemoCredentials(store) {
    const demoCredentialMap = {
        'seller@abc.com': 'Password123',
        'buyer@greensteel.com': 'Password123',
        'sales@ecoplast.com': 'Password123',
    };
    let changed = false;
    for (const user of store.users) {
        const password = demoCredentialMap[user.email?.toLowerCase() ?? ''];
        if (!password)
            continue;
        if (!bcryptjs_1.default.compareSync(password, user.passwordHash)) {
            user.passwordHash = bcryptjs_1.default.hashSync(password, 10);
            changed = true;
        }
    }
    if (changed) {
        saveStore(store);
    }
    return store;
}
function readStore() {
    ensureStoreFile();
    const raw = fs_1.default.readFileSync(DATA_PATH, 'utf-8');
    if (!raw.trim())
        return defaultStore;
    try {
        const parsed = JSON.parse(raw);
        return normalizeDemoCredentials(parsed);
    }
    catch {
        return normalizeDemoCredentials(defaultStore);
    }
}
function saveStore(store) {
    fs_1.default.writeFileSync(DATA_PATH, JSON.stringify(store, null, 2), 'utf-8');
}
function sanitizeUser(user) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
}
function signToken(user) {
    return jsonwebtoken_1.default.sign({ id: user.id, email: user.email, roles: user.roles }, JWT_SECRET, { expiresIn: '7d' });
}
function getAdminUser() {
    return {
        id: 'admin-demo',
        industryName: 'EcoExchange Admin',
        ownerName: 'Platform Admin',
        email: process.env.ADMIN_IDENTIFIER || '/*$/eco555',
        location: 'Head Office',
        contactNumber: '+91 90000 00000',
        passwordHash: '',
        roles: ['ADMIN'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}
function getAuthUser(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer '))
        return null;
    const token = authHeader.replace('Bearer ', '');
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (payload.id === 'admin-demo' && payload.roles?.includes('ADMIN')) {
            return getAdminUser();
        }
        const store = readStore();
        return store.users.find((user) => user.id === payload.id) || null;
    }
    catch {
        return null;
    }
}
function requireAuth(req, res, next) {
    const user = getAuthUser(req);
    if (!user) {
        return res.status(401).json({ message: 'Authentication required.' });
    }
    req.user = user;
    return next();
}
function requireRole(roles) {
    return (req, res, next) => {
        const user = req.user;
        if (!user || !user.roles.some((role) => roles.includes(role))) {
            return res.status(403).json({ message: 'Access denied.' });
        }
        return next();
    };
}
function createOrderCode(store) {
    return `ECO-BUY-${String(store.orders.length + 1).padStart(6, '0')}`;
}
function createListingCode(store) {
    return `ECO-SELL-${String(store.wasteListings.length + 1).padStart(6, '0')}`;
}
function createRequestCode(store) {
    return `ECO-LOG-${String(store.logisticsRequests.length + 1).padStart(6, '0')}`;
}
function normalizeChatStore(store) {
    let changed = false;
    if (!Array.isArray(store.conversations)) {
        store.conversations = [];
        changed = true;
    }
    if (!Array.isArray(store.messages)) {
        store.messages = [];
        changed = true;
    }
    if (changed)
        saveStore(store);
    return store;
}
function getConversationParticipant(conversation, user) {
    return user.roles.includes('ADMIN') || conversation.sellerId === user.id || conversation.buyerId === user.id;
}
function conversationView(store, conversation) {
    const order = store.orders.find((entry) => entry.id === conversation.orderId);
    const seller = store.users.find((entry) => entry.id === conversation.sellerId);
    const buyer = store.users.find((entry) => entry.id === conversation.buyerId);
    const messages = store.messages.filter((message) => message.conversationId === conversation.id);
    const lastMessage = messages[messages.length - 1];
    return {
        ...conversation,
        order: order || null,
        seller: seller ? sanitizeUser(seller) : null,
        buyer: buyer ? sanitizeUser(buyer) : null,
        lastMessage: lastMessage ? { ...lastMessage, content: lastMessage.content.slice(0, 140) } : null,
        unreadCount: messages.filter((message) => !message.isRead).length,
    };
}
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', app: 'EcoExchange' });
});
app.post('/api/auth/register', async (req, res) => {
    const { industryName, ownerName, email, location, contactNumber, password, confirmPassword } = req.body || {};
    if (!industryName || !ownerName || !email || !location || !contactNumber || !password || !confirmPassword) {
        return res.status(400).json({ message: 'Please complete all required fields.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: 'Please enter a valid email address.' });
    }
    if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }
    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match.' });
    }
    const store = readStore();
    if (store.users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
        return res.status(409).json({ message: 'An account with this email already exists.' });
    }
    const newUser = {
        id: (0, crypto_1.randomUUID)(),
        industryName,
        ownerName,
        email: email.toLowerCase(),
        location,
        contactNumber,
        passwordHash: await bcryptjs_1.default.hash(password, 10),
        roles: ['SELLER', 'BUYER'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    store.users.push(newUser);
    saveStore(store);
    const token = signToken(newUser);
    return res.status(201).json({ message: 'Registration successful. Welcome to EcoExchange.', token, user: sanitizeUser(newUser) });
});
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body || {};
    const adminIdentifier = process.env.ADMIN_IDENTIFIER || '/*$/eco555';
    const adminPassword = process.env.ADMIN_PASSWORD || 'eco555';
    if (email === adminIdentifier && password === adminPassword) {
        const adminUser = {
            id: 'admin-demo',
            industryName: 'EcoExchange Admin',
            ownerName: 'Platform Admin',
            email: adminIdentifier,
            location: 'Head Office',
            contactNumber: '+91 90000 00000',
            passwordHash: await bcryptjs_1.default.hash(adminPassword, 10),
            roles: ['ADMIN'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        const token = signToken(adminUser);
        return res.json({ message: 'Login successful.', token, user: sanitizeUser(adminUser) });
    }
    const store = readStore();
    const user = store.users.find((entry) => entry.email.toLowerCase() === String(email || '').toLowerCase());
    if (!user)
        return res.status(401).json({ message: 'Invalid email or password.' });
    const isValid = await bcryptjs_1.default.compare(String(password || ''), user.passwordHash);
    if (!isValid)
        return res.status(401).json({ message: 'Invalid email or password.' });
    const token = signToken(user);
    return res.json({ message: 'Login successful.', token, user: sanitizeUser(user) });
});
app.get('/api/users/me', requireAuth, (req, res) => {
    const user = req.user;
    if (!user)
        return res.status(401).json({ message: 'Authentication required.' });
    return res.json({ user: sanitizeUser(user) });
});
app.put('/api/users/me', requireAuth, (req, res) => {
    const user = req.user;
    if (!user)
        return res.status(401).json({ message: 'Authentication required.' });
    const store = readStore();
    const index = store.users.findIndex((entry) => entry.id === user.id);
    if (index < 0)
        return res.status(404).json({ message: 'User not found.' });
    const updates = req.body || {};
    store.users[index] = {
        ...store.users[index],
        industryName: updates.industryName || store.users[index].industryName,
        ownerName: updates.ownerName || store.users[index].ownerName,
        location: updates.location || store.users[index].location,
        contactNumber: updates.contactNumber || store.users[index].contactNumber,
        updatedAt: new Date().toISOString(),
    };
    saveStore(store);
    return res.json({ user: sanitizeUser(store.users[index]) });
});
app.get('/api/waste', (_req, res) => {
    const store = readStore();
    const listings = store.wasteListings.map((listing) => {
        const seller = store.users.find((user) => user.id === listing.sellerId);
        return { ...listing, seller: seller ? sanitizeUser(seller) : null };
    });
    return res.json({ listings });
});
app.get('/api/waste/:id', (req, res) => {
    const store = readStore();
    const listing = store.wasteListings.find((entry) => entry.id === req.params.id);
    if (!listing)
        return res.status(404).json({ message: 'Waste listing not found.' });
    const seller = store.users.find((user) => user.id === listing.sellerId);
    return res.json({ listing: { ...listing, seller: seller ? sanitizeUser(seller) : null } });
});
app.post('/api/waste', requireAuth, requireRole(['SELLER']), (req, res) => {
    const user = req.user;
    if (!user)
        return res.status(401).json({ message: 'Authentication required.' });
    const { wasteType, quantity, unit, price, location, description, imageUrl } = req.body || {};
    if (!wasteType || !quantity || !unit || !price || !location || !description) {
        return res.status(400).json({ message: 'Please complete all required listing fields.' });
    }
    const store = readStore();
    const listing = {
        id: (0, crypto_1.randomUUID)(),
        wasteType,
        quantity: Number(quantity),
        unit,
        price: Number(price),
        location,
        description,
        imageUrl: imageUrl || null,
        sellerId: user.id,
        availability: 'Available',
        status: 'LISTED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    store.wasteListings.unshift(listing);
    saveStore(store);
    return res.status(201).json({ message: 'Waste listing created successfully.', listing });
});
app.post('/api/orders', requireAuth, requireRole(['BUYER']), (req, res) => {
    const user = req.user;
    if (!user)
        return res.status(401).json({ message: 'Authentication required.' });
    const { listingId } = req.body || {};
    if (!listingId)
        return res.status(400).json({ message: 'Listing is required.' });
    const store = readStore();
    const listing = store.wasteListings.find((entry) => entry.id === listingId);
    if (!listing)
        return res.status(404).json({ message: 'Listing not found.' });
    const basePrice = Number(listing.price);
    const buyerCommission = basePrice * BUYER_COMMISSION_RATE;
    const transportCharge = TRANSPORT_CHARGE;
    const finalAmount = basePrice + buyerCommission + transportCharge;
    const seller = store.users.find((entry) => entry.id === listing.sellerId);
    if (!seller)
        return res.status(404).json({ message: 'Seller not found.' });
    const order = {
        id: (0, crypto_1.randomUUID)(),
        orderCode: `ECO-BUY-${String(store.orders.length + 1).padStart(6, '0')}`,
        orderType: 'BUY',
        buyerId: user.id,
        sellerId: seller.id,
        wasteListingId: listing.id,
        wasteType: listing.wasteType,
        quantity: listing.quantity,
        location: listing.location,
        basePrice,
        buyerCommission,
        sellerCommission: basePrice * SELLER_COMMISSION_RATE,
        transportCharge,
        finalAmount,
        status: 'ORDER_PLACED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    const transaction = {
        id: (0, crypto_1.randomUUID)(),
        orderId: order.id,
        type: 'BUY',
        amount: finalAmount,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
    };
    store.orders.unshift(order);
    store.transactions.push(transaction);
    listing.status = 'ORDERED';
    saveStore(store);
    return res.status(201).json({ message: 'Order placed successfully.', order, transaction });
});
app.get('/api/orders', requireAuth, (req, res) => {
    const user = req.user;
    if (!user)
        return res.status(401).json({ message: 'Authentication required.' });
    const store = readStore();
    const orders = store.orders.filter((order) => order.buyerId === user.id || order.sellerId === user.id);
    return res.json({ orders });
});
app.get('/api/conversations', requireAuth, (req, res) => {
    const user = req.user;
    if (!user)
        return res.status(401).json({ message: 'Authentication required.' });
    const store = normalizeChatStore(readStore());
    const conversations = store.conversations
        .filter((conversation) => getConversationParticipant(conversation, user))
        .map((conversation) => conversationView(store, conversation))
        .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
    return res.json({ conversations });
});
app.post('/api/conversations', requireAuth, requireRole(['SELLER', 'BUYER']), (req, res) => {
    const user = req.user;
    if (!user)
        return res.status(401).json({ message: 'Authentication required.' });
    const { orderId } = req.body || {};
    if (!orderId)
        return res.status(400).json({ message: 'An order is required.' });
    const store = normalizeChatStore(readStore());
    const order = store.orders.find((entry) => entry.id === orderId);
    if (!order)
        return res.status(404).json({ message: 'Order not found.' });
    if (order.buyerId !== user.id && order.sellerId !== user.id)
        return res.status(403).json({ message: 'You cannot access this order conversation.' });
    let conversation = store.conversations.find((entry) => entry.orderId === order.id);
    if (!conversation) {
        conversation = { id: (0, crypto_1.randomUUID)(), orderId: order.id, sellerId: order.sellerId, buyerId: order.buyerId, adminId: 'admin-demo', status: 'OPEN', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        store.conversations.unshift(conversation);
        saveStore(store);
    }
    return res.status(201).json({ conversation: conversationView(store, conversation) });
});
app.get('/api/conversations/:id/messages', requireAuth, (req, res) => {
    const user = req.user;
    if (!user)
        return res.status(401).json({ message: 'Authentication required.' });
    const store = normalizeChatStore(readStore());
    const conversation = store.conversations.find((entry) => entry.id === req.params.id);
    if (!conversation)
        return res.status(404).json({ message: 'Conversation not found.' });
    if (!getConversationParticipant(conversation, user))
        return res.status(403).json({ message: 'Access denied.' });
    return res.json({ conversation: conversationView(store, conversation), messages: store.messages.filter((message) => message.conversationId === conversation.id) });
});
app.post('/api/conversations/:id/messages', requireAuth, (req, res) => {
    const user = req.user;
    if (!user)
        return res.status(401).json({ message: 'Authentication required.' });
    const text = String(req.body?.content || '').trim();
    if (!text)
        return res.status(400).json({ message: 'Message cannot be empty.' });
    if (text.length > 4000)
        return res.status(400).json({ message: 'Message is too long.' });
    const store = normalizeChatStore(readStore());
    const conversation = store.conversations.find((entry) => entry.id === req.params.id);
    if (!conversation)
        return res.status(404).json({ message: 'Conversation not found.' });
    if (!getConversationParticipant(conversation, user))
        return res.status(403).json({ message: 'Access denied.' });
    if (conversation.status === 'CLOSED')
        return res.status(409).json({ message: 'This conversation is closed.' });
    const senderRole = user.roles.includes('ADMIN') ? 'ADMIN' : user.roles.includes('SELLER') && conversation.sellerId === user.id ? 'SELLER' : conversation.buyerId === user.id ? 'BUYER' : null;
    if (!senderRole)
        return res.status(403).json({ message: 'You cannot send messages in this conversation.' });
    const requestedReceiverRole = req.body?.receiverRole;
    if (senderRole === 'ADMIN' && requestedReceiverRole !== 'SELLER' && requestedReceiverRole !== 'BUYER')
        return res.status(400).json({ message: 'Admin messages must target a seller or buyer.' });
    const receiverRole = senderRole === 'ADMIN' ? requestedReceiverRole : 'ADMIN';
    const receiverId = receiverRole === 'SELLER' ? conversation.sellerId : receiverRole === 'BUYER' ? conversation.buyerId : 'admin-demo';
    const message = { id: (0, crypto_1.randomUUID)(), conversationId: conversation.id, senderId: user.id, senderRole, receiverId, receiverRole, content: text, isRead: false, createdAt: new Date().toISOString() };
    store.messages.push(message);
    conversation.updatedAt = message.createdAt;
    conversation.lastMessageAt = message.createdAt;
    saveStore(store);
    return res.status(201).json({ message });
});
app.put('/api/conversations/:id/read', requireAuth, (req, res) => {
    const user = req.user;
    if (!user)
        return res.status(401).json({ message: 'Authentication required.' });
    const store = normalizeChatStore(readStore());
    const conversation = store.conversations.find((entry) => entry.id === req.params.id);
    if (!conversation)
        return res.status(404).json({ message: 'Conversation not found.' });
    if (!getConversationParticipant(conversation, user))
        return res.status(403).json({ message: 'Access denied.' });
    store.messages.forEach((message) => { if (message.conversationId === conversation.id && message.receiverId === user.id)
        message.isRead = true; });
    saveStore(store);
    return res.json({ message: 'Conversation marked as read.' });
});
app.put('/api/messages/:id/read', requireAuth, (req, res) => {
    const user = req.user;
    if (!user)
        return res.status(401).json({ message: 'Authentication required.' });
    const store = normalizeChatStore(readStore());
    const message = store.messages.find((entry) => entry.id === req.params.id);
    if (!message)
        return res.status(404).json({ message: 'Message not found.' });
    const conversation = store.conversations.find((entry) => entry.id === message.conversationId);
    if (!conversation || !getConversationParticipant(conversation, user))
        return res.status(403).json({ message: 'Access denied.' });
    if (message.receiverId !== user.id && !user.roles.includes('ADMIN'))
        return res.status(403).json({ message: 'Only the recipient can mark this message as read.' });
    message.isRead = true;
    saveStore(store);
    return res.json({ message: 'Message marked as read.' });
});
app.delete('/api/conversations/:conversationId/messages/:messageId', requireAuth, requireRole(['ADMIN']), (req, res) => {
    const store = normalizeChatStore(readStore());
    const message = store.messages.find((entry) => entry.id === req.params.messageId && entry.conversationId === req.params.conversationId);
    if (!message)
        return res.status(404).json({ message: 'Message not found.' });
    store.messages = store.messages.filter((entry) => entry.id !== message.id);
    saveStore(store);
    return res.json({ message: 'Message deleted.' });
});
app.put('/api/conversations/:id/status', requireAuth, requireRole(['ADMIN']), (req, res) => {
    const { status } = req.body || {};
    if (status !== 'OPEN' && status !== 'CLOSED')
        return res.status(400).json({ message: 'Invalid conversation status.' });
    const store = normalizeChatStore(readStore());
    const conversation = store.conversations.find((entry) => entry.id === req.params.id);
    if (!conversation)
        return res.status(404).json({ message: 'Conversation not found.' });
    conversation.status = status;
    conversation.updatedAt = new Date().toISOString();
    saveStore(store);
    return res.json({ conversation: conversationView(store, conversation) });
});
app.put('/api/orders/:id/status', requireAuth, (req, res) => {
    const { status } = req.body || {};
    const store = readStore();
    const order = store.orders.find((entry) => entry.id === req.params.id);
    if (!order)
        return res.status(404).json({ message: 'Order not found.' });
    order.status = status;
    order.updatedAt = new Date().toISOString();
    saveStore(store);
    return res.json({ message: 'Order status updated.', order });
});
app.get('/api/admin/overview', requireAuth, requireRole(['ADMIN']), (_req, res) => {
    const store = readStore();
    const overview = {
        totalIndustries: store.users.length,
        totalSellers: store.users.filter((entry) => entry.roles.includes('SELLER')).length,
        totalBuyers: store.users.filter((entry) => entry.roles.includes('BUYER')).length,
        totalWasteListings: store.wasteListings.length,
        totalOrders: store.orders.length,
        pendingOrders: store.orders.filter((order) => ['ORDER_PLACED', 'ADMIN_REVIEW'].includes(order.status)).length,
        forwardedOrders: store.orders.filter((order) => order.status === 'FORWARDED_TO_LOGISTICS').length,
        completedOrders: store.orders.filter((order) => order.status === 'COMPLETED').length,
    };
    return res.json({ overview });
});
app.get('/api/admin/orders', requireAuth, requireRole(['ADMIN']), (_req, res) => {
    const store = readStore();
    const orders = store.orders.map((order) => {
        const buyer = store.users.find((user) => user.id === order.buyerId);
        const seller = store.users.find((user) => user.id === order.sellerId);
        return { ...order, buyer: buyer ? sanitizeUser(buyer) : null, seller: seller ? sanitizeUser(seller) : null };
    });
    return res.json({ orders });
});
app.get('/api/admin/users', requireAuth, requireRole(['ADMIN']), (_req, res) => {
    const store = readStore();
    return res.json({ users: store.users.map((user) => sanitizeUser(user)) });
});
app.get('/api/admin/listings', requireAuth, requireRole(['ADMIN']), (_req, res) => {
    const store = readStore();
    return res.json({ listings: store.wasteListings });
});
app.post('/api/admin/orders/:id/forward-logistics', requireAuth, requireRole(['ADMIN']), (req, res) => {
    const { logisticsCompanyId } = req.body || {};
    const store = readStore();
    const order = store.orders.find((entry) => entry.id === req.params.id);
    if (!order)
        return res.status(404).json({ message: 'Order not found.' });
    const company = store.logisticsCompanies.find((entry) => entry.id === logisticsCompanyId);
    if (!company)
        return res.status(404).json({ message: 'Logistics company not found.' });
    const request = {
        id: (0, crypto_1.randomUUID)(),
        requestCode: `ECO-LOG-${String(store.logisticsRequests.length + 1).padStart(6, '0')}`,
        orderId: order.id,
        logisticsCompanyId: company.id,
        pickupLocation: order.location,
        deliveryLocation: 'Warehouse Center',
        wasteType: order.wasteType,
        quantity: order.quantity,
        transportCharge: order.transportCharge,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    order.status = 'FORWARDED_TO_LOGISTICS';
    order.updatedAt = new Date().toISOString();
    store.logisticsRequests.push(request);
    saveStore(store);
    return res.json({ message: 'Order successfully forwarded to logistics.', request });
});
app.get('/api/admin/logistics', requireAuth, requireRole(['ADMIN']), (_req, res) => {
    const store = readStore();
    const requests = store.logisticsRequests.map((request) => {
        const order = store.orders.find((entry) => entry.id === request.orderId);
        const company = store.logisticsCompanies.find((entry) => entry.id === request.logisticsCompanyId);
        return { ...request, order, company };
    });
    return res.json({ logisticsRequests: requests, logisticsCompanies: store.logisticsCompanies });
});
app.post('/api/admin/logistics/assign', requireAuth, requireRole(['ADMIN']), (req, res) => {
    const { requestId, logisticsCompanyId } = req.body || {};
    const store = readStore();
    const request = store.logisticsRequests.find((entry) => entry.id === requestId);
    if (!request)
        return res.status(404).json({ message: 'Logistics request not found.' });
    const company = store.logisticsCompanies.find((entry) => entry.id === logisticsCompanyId);
    if (!company)
        return res.status(404).json({ message: 'Logistics company not found.' });
    request.logisticsCompanyId = company.id;
    request.status = 'ASSIGNED';
    request.updatedAt = new Date().toISOString();
    saveStore(store);
    return res.json({ message: 'Logistics company assigned.', request });
});
app.put('/api/admin/logistics/:id/status', requireAuth, requireRole(['ADMIN']), (req, res) => {
    const { status } = req.body || {};
    const store = readStore();
    const request = store.logisticsRequests.find((entry) => entry.id === req.params.id);
    if (!request)
        return res.status(404).json({ message: 'Logistics request not found.' });
    request.status = status;
    request.updatedAt = new Date().toISOString();
    saveStore(store);
    return res.json({ message: 'Logistics status updated.', request });
});
app.use((err, _req, res, _next) => {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong.' });
});
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`EcoExchange server running on http://localhost:${PORT}`);
    });
}
exports.default = app;
