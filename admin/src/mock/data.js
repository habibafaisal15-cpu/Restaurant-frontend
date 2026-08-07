const now = new Date();
const daysAgo = (n) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString();
const hoursAgo = (n) => new Date(now.getTime() - n * 60 * 60 * 1000).toISOString();
const minutesAgo = (n) => new Date(now.getTime() - n * 60 * 1000).toISOString();

let idCounter = 100;

export function nextId(prefix = 'id') {
  idCounter += 1;
  return `${prefix}-${String(idCounter).padStart(3, '0')}`;
}

let tokenCounter = 47;

export function generateTokenNumber() {
  tokenCounter += 1;
  return `T-${String(tokenCounter).padStart(3, '0')}`;
}

export let categories = [
  {
    id: 'cat-001',
    name: 'Biryani',
    description: 'Authentic Karachi-style biryanis slow-cooked with premium basmati rice and house spices.',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&h=400&fit=crop',
    heroImage: 'https://images.unsplash.com/photo-1589302168068-964664a07101?w=1200&h=600&fit=crop',
    heroTitle: 'Signature Biryani Collection',
    showInHero: true,
    sortOrder: 1,
    active: true,
    itemCount: 4,
    createdAt: daysAgo(90),
    updatedAt: daysAgo(2),
  },
  {
    id: 'cat-002',
    name: 'BBQ',
    description: 'Charcoal-grilled kebabs, tikka, and seekh prepared fresh on traditional angithi.',
    image: 'https://images.unsplash.com/photo-1529042410759-befb1204b916?w=600&h=400&fit=crop',
    heroImage: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&h=600&fit=crop',
    heroTitle: 'Smoky BBQ Specials',
    showInHero: true,
    sortOrder: 2,
    active: true,
    itemCount: 3,
    createdAt: daysAgo(88),
    updatedAt: daysAgo(5),
  },
  {
    id: 'cat-003',
    name: 'Karahi',
    description: 'Wok-style karahi dishes with rich tomato and ginger base, served sizzling hot.',
    image: 'https://images.unsplash.com/photo-1606491956689-2ea866880f84?w=600&h=400&fit=crop',
    heroImage: 'https://images.unsplash.com/photo-1626074353767-517a3e46162e?w=1200&h=600&fit=crop',
    heroTitle: 'Handi & Karahi Favorites',
    showInHero: true,
    sortOrder: 3,
    active: true,
    itemCount: 3,
    createdAt: daysAgo(85),
    updatedAt: daysAgo(1),
  },
  {
    id: 'cat-004',
    name: 'Burgers',
    description: 'Juicy smash burgers, grilled chicken fillets, and loaded gourmet options.',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop',
    heroImage: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=1200&h=600&fit=crop',
    heroTitle: 'Gourmet Burger Bar',
    showInHero: false,
    sortOrder: 4,
    active: true,
    itemCount: 3,
    createdAt: daysAgo(60),
    updatedAt: daysAgo(10),
  },
  {
    id: 'cat-005',
    name: 'Desserts',
    description: 'Classic Pakistani sweets and modern desserts to finish your meal.',
    image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&h=400&fit=crop',
    heroImage: 'https://images.unsplash.com/photo-1488477181941-642983a247ea?w=1200&h=600&fit=crop',
    heroTitle: 'Sweet Endings',
    showInHero: false,
    sortOrder: 5,
    active: true,
    itemCount: 3,
    createdAt: daysAgo(55),
    updatedAt: daysAgo(7),
  },
  {
    id: 'cat-006',
    name: 'Beverages',
    description: 'Fresh lassi, karak chai, soft drinks, and seasonal coolers.',
    image: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=600&h=400&fit=crop',
    heroImage: 'https://images.unsplash.com/photo-1513558161293-cb88b8b7a4e8?w=1200&h=600&fit=crop',
    heroTitle: 'Refresh & Recharge',
    showInHero: false,
    sortOrder: 6,
    active: true,
    itemCount: 4,
    createdAt: daysAgo(50),
    updatedAt: daysAgo(3),
  },
];

export let menuItems = [
  {
    id: 'item-001',
    categoryId: 'cat-001',
    name: 'Chicken Biryani',
    description: 'Half kg serving with raita and shami kebab.',
    price: 650,
    discountPrice: 599,
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop',
    available: true,
    active: true,
    tags: ['bestseller', 'spicy'],
    createdAt: daysAgo(80),
    updatedAt: daysAgo(2),
  },
  {
    id: 'item-002',
    categoryId: 'cat-001',
    name: 'Beef Biryani',
    description: 'Tender beef chunks layered with fragrant rice.',
    price: 850,
    image: 'https://images.unsplash.com/photo-1589302168068-964664a07101?w=400&h=300&fit=crop',
    available: true,
    active: true,
    tags: ['premium'],
    createdAt: daysAgo(80),
    updatedAt: daysAgo(2),
  },
  {
    id: 'item-003',
    categoryId: 'cat-001',
    name: 'Mutton Biryani',
    description: 'Slow-cooked mutton with saffron-infused rice.',
    price: 1200,
    image: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8f3a?w=400&h=300&fit=crop',
    available: true,
    active: true,
    tags: ['premium', 'weekend-special'],
    createdAt: daysAgo(75),
    updatedAt: daysAgo(4),
  },
  {
    id: 'item-004',
    categoryId: 'cat-001',
    name: 'Vegetable Biryani',
    description: 'Seasonal vegetables with aromatic spices.',
    price: 450,
    image: 'https://images.unsplash.com/photo-1645177628172-a0a4bd0a6f6e?w=400&h=300&fit=crop',
    available: true,
    active: true,
    tags: ['vegetarian'],
    createdAt: daysAgo(70),
    updatedAt: daysAgo(6),
  },
  {
    id: 'item-005',
    categoryId: 'cat-002',
    name: 'Chicken Tikka',
    description: 'Boneless chicken marinated overnight, charcoal grilled.',
    price: 750,
    discountPrice: 699,
    image: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=400&h=300&fit=crop',
    available: true,
    active: true,
    tags: ['bestseller', 'grilled'],
    createdAt: daysAgo(78),
    updatedAt: daysAgo(1),
  },
  {
    id: 'item-006',
    categoryId: 'cat-002',
    name: 'Beef Seekh Kebab',
    description: 'Hand-minced beef skewers with herbs and spices.',
    price: 680,
    image: 'https://images.unsplash.com/photo-1529042410759-befb1204b916?w=400&h=300&fit=crop',
    available: true,
    active: true,
    tags: ['grilled'],
    createdAt: daysAgo(76),
    updatedAt: daysAgo(3),
  },
  {
    id: 'item-007',
    categoryId: 'cat-002',
    name: 'Malai Boti',
    description: 'Creamy marinated chicken cubes, mild and tender.',
    price: 820,
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
    available: false,
    active: true,
    tags: ['mild'],
    createdAt: daysAgo(74),
    updatedAt: hoursAgo(5),
  },
  {
    id: 'item-008',
    categoryId: 'cat-003',
    name: 'Chicken Karahi',
    description: 'Classic Lahori-style karahi for two.',
    price: 1450,
    image: 'https://images.unsplash.com/photo-1606491956689-2ea866880f84?w=400&h=300&fit=crop',
    available: true,
    active: true,
    tags: ['bestseller', 'spicy'],
    createdAt: daysAgo(72),
    updatedAt: daysAgo(1),
  },
  {
    id: 'item-009',
    categoryId: 'cat-003',
    name: 'Mutton Karahi',
    description: 'Tender mutton cooked in wok with tomatoes and green chilies.',
    price: 2200,
    image: 'https://images.unsplash.com/photo-1626074353767-517a3e46162e?w=400&h=300&fit=crop',
    available: true,
    active: true,
    tags: ['premium'],
    createdAt: daysAgo(70),
    updatedAt: daysAgo(2),
  },
  {
    id: 'item-010',
    categoryId: 'cat-003',
    name: 'Paneer Handi',
    description: 'Cottage cheese in creamy tomato gravy.',
    price: 980,
    image: 'https://images.unsplash.com/photo-1631452180519-f014a0462747?w=400&h=300&fit=crop',
    available: true,
    active: true,
    tags: ['vegetarian', 'mild'],
    createdAt: daysAgo(68),
    updatedAt: daysAgo(8),
  },
  {
    id: 'item-011',
    categoryId: 'cat-004',
    name: 'Classic Beef Burger',
    description: 'Angus patty, cheddar, lettuce, house sauce.',
    price: 550,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
    available: true,
    active: true,
    tags: ['popular'],
    createdAt: daysAgo(55),
    updatedAt: daysAgo(4),
  },
  {
    id: 'item-012',
    categoryId: 'cat-004',
    name: 'Crispy Chicken Burger',
    description: 'Double-fried fillet with coleslaw and mayo.',
    price: 520,
    discountPrice: 479,
    image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop',
    available: true,
    active: true,
    tags: ['bestseller'],
    createdAt: daysAgo(54),
    updatedAt: daysAgo(2),
  },
  {
    id: 'item-013',
    categoryId: 'cat-004',
    name: 'Mushroom Swiss Burger',
    description: 'Sautéed mushrooms, Swiss cheese, caramelized onions.',
    price: 620,
    image: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0df?w=400&h=300&fit=crop',
    available: true,
    active: true,
    tags: ['gourmet'],
    createdAt: daysAgo(52),
    updatedAt: daysAgo(6),
  },
  {
    id: 'item-014',
    categoryId: 'cat-005',
    name: 'Gulab Jamun (2 pcs)',
    description: 'Warm milk dumplings in rose-cardamom syrup.',
    price: 180,
    image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop',
    available: true,
    active: true,
    tags: ['traditional'],
    createdAt: daysAgo(48),
    updatedAt: daysAgo(10),
  },
  {
    id: 'item-015',
    categoryId: 'cat-005',
    name: 'Kheer',
    description: 'Slow-cooked rice pudding with pistachios.',
    price: 220,
    image: 'https://images.unsplash.com/photo-1488477181941-642983a247ea?w=400&h=300&fit=crop',
    available: true,
    active: true,
    tags: ['traditional'],
    createdAt: daysAgo(47),
    updatedAt: daysAgo(9),
  },
  {
    id: 'item-016',
    categoryId: 'cat-005',
    name: 'Chocolate Lava Cake',
    description: 'Warm molten center with vanilla ice cream.',
    price: 450,
    image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400&h=300&fit=crop',
    available: true,
    active: true,
    tags: ['modern'],
    createdAt: daysAgo(45),
    updatedAt: daysAgo(3),
  },
  {
    id: 'item-017',
    categoryId: 'cat-006',
    name: 'Sweet Lassi',
    description: 'Thick yogurt drink blended with rose water.',
    price: 150,
    image: 'https://images.unsplash.com/photo-1626074353767-517a3e46162e?w=400&h=300&fit=crop',
    available: true,
    active: true,
    tags: ['refreshing'],
    createdAt: daysAgo(44),
    updatedAt: daysAgo(2),
  },
  {
    id: 'item-018',
    categoryId: 'cat-006',
    name: 'Karak Chai',
    description: 'Strong milk tea brewed with cardamom.',
    price: 120,
    image: 'https://images.unsplash.com/photo-1571934811353-0429b2b4d4b4?w=400&h=300&fit=crop',
    available: true,
    active: true,
    tags: ['hot'],
    createdAt: daysAgo(43),
    updatedAt: daysAgo(1),
  },
  {
    id: 'item-019',
    categoryId: 'cat-006',
    name: 'Fresh Lime Soda',
    description: 'Sparkling water with fresh lime and mint.',
    price: 130,
    image: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=400&h=300&fit=crop',
    available: true,
    active: true,
    tags: ['refreshing'],
    createdAt: daysAgo(42),
    updatedAt: daysAgo(5),
  },
  {
    id: 'item-020',
    categoryId: 'cat-006',
    name: 'Mango Shake',
    description: 'Seasonal Sindhri mangoes blended with milk.',
    price: 280,
    discountPrice: 249,
    image: 'https://images.unsplash.com/photo-1623065422902-30a2e2df7a13?w=400&h=300&fit=crop',
    available: true,
    active: true,
    tags: ['seasonal', 'bestseller'],
    createdAt: daysAgo(40),
    updatedAt: daysAgo(1),
  },
];

export let riders = [
  {
    id: 'rider-001',
    name: 'Ahmed Khan',
    phone: '+92 300 1234567',
    vehicleNumber: 'KHI-4521',
    status: 'available',
    active: true,
    deliveredCount: 342,
    createdAt: daysAgo(120),
    updatedAt: hoursAgo(1),
  },
  {
    id: 'rider-002',
    name: 'Bilal Hussain',
    phone: '+92 321 9876543',
    vehicleNumber: 'KHI-8890',
    status: 'busy',
    active: true,
    deliveredCount: 278,
    createdAt: daysAgo(100),
    updatedAt: minutesAgo(20),
  },
  {
    id: 'rider-003',
    name: 'Usman Ali',
    phone: '+92 333 5551234',
    vehicleNumber: 'KHI-3312',
    status: 'available',
    active: true,
    deliveredCount: 195,
    createdAt: daysAgo(80),
    updatedAt: hoursAgo(3),
  },
  {
    id: 'rider-004',
    name: 'Faisal Raza',
    phone: '+92 345 7778899',
    vehicleNumber: 'KHI-6678',
    status: 'offline',
    active: false,
    deliveredCount: 89,
    createdAt: daysAgo(45),
    updatedAt: daysAgo(2),
  },
];

/** Delivery hubs — each pin + radiusKm drives customer-map coverage */
export let deliveryLocations = [
  {
    id: 'loc-001',
    name: 'Clifton Hub',
    address: 'Block 5, Clifton, Karachi',
    latitude: 24.8138,
    longitude: 67.0299,
    radiusKm: 10,
    active: true,
    notes: 'Main kitchen / default delivery center',
    createdAt: daysAgo(90),
    updatedAt: daysAgo(2),
  },
  {
    id: 'loc-002',
    name: 'DHA Phase 6 Hub',
    address: 'Khayaban-e-Shahbaz, DHA Phase 6, Karachi',
    latitude: 24.8035,
    longitude: 67.0651,
    radiusKm: 10,
    active: true,
    notes: 'Covers DHA Phase 4–8',
    createdAt: daysAgo(60),
    updatedAt: daysAgo(5),
  },
  {
    id: 'loc-003',
    name: 'Gulshan Hub',
    address: 'Block 13-D, Gulshan-e-Iqbal, Karachi',
    latitude: 24.9203,
    longitude: 67.0894,
    radiusKm: 8,
    active: false,
    notes: 'Temporarily paused',
    createdAt: daysAgo(40),
    updatedAt: daysAgo(1),
  },
];

function buildOrderItem(menuItemId, quantity, notes = '') {
  const item = menuItems.find((m) => m.id === menuItemId);
  const unitPrice = item?.discountPrice ?? item?.price ?? 0;
  return {
    menuItemId,
    name: item?.name ?? 'Unknown Item',
    quantity,
    unitPrice,
    price: unitPrice,
    subtotal: unitPrice * quantity,
    notes,
  };
}

function calcTotals(items, { deliveryFee = 0, discount = 0 } = {}) {
  const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
  const tax = Math.round(subtotal * (settings.taxPercent / 100));
  const serviceCharge = Math.round(subtotal * (settings.serviceChargePercent / 100));
  const total = subtotal + tax + serviceCharge + deliveryFee - discount;
  return { subtotal, tax, serviceCharge, deliveryFee, discount, total };
}

export let settings = {
  restaurantName: 'Your Kitchen',
  tagline: 'Authentic flavors, delivered fresh',
  logo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop',
  phone: '+92 21 34567890',
  email: 'hello@yourkitchen.com',
  address: 'Block 5, Clifton, Karachi',
  taxPercent: 5,
  serviceChargePercent: 3,
  deliveryFee: 150,
  currency: 'PKR',
  isOpen: true,
  announcement: 'Free delivery on orders above Rs 2,000 this weekend!',
  slipFooter: 'Thank you for choosing Your Kitchen. Visit again!',
  autoSlipWalkIn: true,
  autoSlipOnlineAccept: true,
  openingHours: {
    monday: { open: '11:00', close: '23:30', closed: false },
    tuesday: { open: '11:00', close: '23:30', closed: false },
    wednesday: { open: '11:00', close: '23:30', closed: false },
    thursday: { open: '11:00', close: '23:30', closed: false },
    friday: { open: '11:00', close: '00:30', closed: false },
    saturday: { open: '11:00', close: '00:30', closed: false },
    sunday: { open: '12:00', close: '23:00', closed: false },
  },
  updatedAt: daysAgo(1),
};

/** Customer home hero — max 5 rotating slides + 3 fixed side pictures */
export let heroContent = {
  slides: [
    {
      id: 'slide-001',
      image: 'https://images.unsplash.com/photo-1589302168068-964664a07101?w=1400&h=700&fit=crop',
      title: '',
      active: true,
      sortOrder: 1,
    },
    {
      id: 'slide-002',
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1400&h=700&fit=crop',
      title: '',
      active: true,
      sortOrder: 2,
    },
    {
      id: 'slide-003',
      image: 'https://images.unsplash.com/photo-1626074353767-517a3e46162e?w=1400&h=700&fit=crop',
      title: '',
      active: true,
      sortOrder: 3,
    },
  ],
  sideCards: [
    {
      id: 'side-menu',
      key: 'menu',
      title: 'Menu',
      image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop',
      link: '/menu',
    },
    {
      id: 'side-topseller',
      key: 'topseller',
      title: 'Top Seller',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop',
      link: '/menu?filter=bestseller',
    },
    {
      id: 'side-deals',
      key: 'deals',
      title: 'Deals',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop',
      link: '/deals',
    },
  ],
  topDeals: [],
  updatedAt: daysAgo(2),
};

/** Customer-facing deals managed from Admin → Deals module */
export let deals = [
  {
    id: 'deal-001',
    title: 'Chicken Biryani Deal',
    description: 'Full plate chicken biryani with raita & salad. Perfect for lunch or dinner.',
    price: 599,
    originalPrice: 750,
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&h=400&fit=crop',
    badge: '20% OFF',
    active: true,
    showOnCustomer: true,
    sortOrder: 1,
    createdAt: daysAgo(14),
    updatedAt: daysAgo(1),
  },
  {
    id: 'deal-002',
    title: 'Family Steak Combo',
    description: '2 steaks, fries, coleslaw & 1.5L drink. Great value for sharing.',
    price: 2499,
    originalPrice: 3200,
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&h=400&fit=crop',
    badge: 'Family Pack',
    active: true,
    showOnCustomer: true,
    sortOrder: 2,
    createdAt: daysAgo(10),
    updatedAt: daysAgo(2),
  },
  {
    id: 'deal-003',
    title: 'Chinese Platter',
    description: 'Chicken manchurian, fried rice & hot & sour soup — weekday special.',
    price: 899,
    originalPrice: 1150,
    image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=600&h=400&fit=crop',
    badge: 'Limited',
    active: true,
    showOnCustomer: true,
    sortOrder: 3,
    createdAt: daysAgo(7),
    updatedAt: daysAgo(1),
  },
  {
    id: 'deal-004',
    title: 'Mango Shake Special',
    description: 'Thick mango shake with ice cream scoop. Seasonal freshness.',
    price: 249,
    originalPrice: 320,
    image: 'https://images.unsplash.com/photo-1623065422902-30a2e2df7a13?w=600&h=400&fit=crop',
    badge: 'Seasonal',
    active: true,
    showOnCustomer: true,
    sortOrder: 4,
    createdAt: daysAgo(5),
    updatedAt: hoursAgo(6),
  },
];

export function getDeals() {
  return deals;
}

export function syncHeroTopDeals() {
  heroContent.topDeals = deals
    .filter((d) => d.active && d.showOnCustomer)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((d) => ({
      id: d.id,
      title: d.title,
      badge: d.badge,
      price: d.price,
      originalPrice: d.originalPrice,
      image: d.image,
      description: d.description,
      active: d.active,
    }));
  heroContent.updatedAt = new Date().toISOString();
  return heroContent.topDeals;
}

syncHeroTopDeals();

export let orders = [
  {
    id: 'ord-001',
    orderNumber: 'YK-1001',
    channel: 'ONLINE',
    type: 'DELIVERY',
    status: 'pending',
    customer: {
      name: 'Sara Ahmed',
      phone: '+92 300 1112233',
      email: 'sara@email.com',
      address: 'House 12, Street 5, DHA Phase 6, Karachi',
    },
    items: [buildOrderItem('item-001', 2), buildOrderItem('item-017', 2)],
    ...calcTotals([buildOrderItem('item-001', 2), buildOrderItem('item-017', 2)], { deliveryFee: 150 }),
    paymentMethod: 'online',
    paymentStatus: 'paid',
    riderId: null,
    notes: 'Extra raita please',
    slip: null,
    statusHistory: [{ status: 'pending', at: minutesAgo(8), by: 'system' }],
    createdAt: minutesAgo(8),
    updatedAt: minutesAgo(8),
  },
  {
    id: 'ord-002',
    orderNumber: 'YK-1002',
    channel: 'ONLINE',
    type: 'DELIVERY',
    status: 'confirmed',
    customer: {
      name: 'Hamza Malik',
      phone: '+92 321 4445566',
      email: 'hamza@email.com',
      address: 'Apartment 4B, Bahria Town, Karachi',
    },
    items: [buildOrderItem('item-008', 1), buildOrderItem('item-006', 2)],
    ...calcTotals([buildOrderItem('item-008', 1), buildOrderItem('item-006', 2)], { deliveryFee: 150 }),
    paymentMethod: 'online',
    paymentStatus: 'paid',
    riderId: null,
    notes: '',
    slip: null,
    statusHistory: [
      { status: 'pending', at: minutesAgo(35), by: 'system' },
      { status: 'confirmed', at: minutesAgo(30), by: 'Admin User' },
    ],
    createdAt: minutesAgo(35),
    updatedAt: minutesAgo(30),
  },
  {
    id: 'ord-003',
    orderNumber: 'YK-1003',
    channel: 'ONLINE',
    type: 'DELIVERY',
    status: 'preparing',
    customer: {
      name: 'Ayesha Noor',
      phone: '+92 333 7778899',
      address: 'Gulshan-e-Iqbal, Block 13D, Karachi',
    },
    items: [buildOrderItem('item-005', 1), buildOrderItem('item-012', 2), buildOrderItem('item-019', 2)],
    ...calcTotals(
      [buildOrderItem('item-005', 1), buildOrderItem('item-012', 2), buildOrderItem('item-019', 2)],
      { deliveryFee: 150 },
    ),
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    riderId: null,
    notes: 'Ring doorbell twice',
    slip: null,
    statusHistory: [
      { status: 'pending', at: minutesAgo(50), by: 'system' },
      { status: 'confirmed', at: minutesAgo(45), by: 'Admin User' },
      { status: 'preparing', at: minutesAgo(40), by: 'Kitchen' },
    ],
    createdAt: minutesAgo(50),
    updatedAt: minutesAgo(40),
  },
  {
    id: 'ord-004',
    orderNumber: 'YK-1004',
    channel: 'ONLINE',
    type: 'DELIVERY',
    status: 'rider_assigned',
    customer: {
      name: 'Omar Farooq',
      phone: '+92 345 2223344',
      address: 'North Nazimabad, Block L, Karachi',
    },
    items: [buildOrderItem('item-002', 1), buildOrderItem('item-014', 2)],
    ...calcTotals([buildOrderItem('item-002', 1), buildOrderItem('item-014', 2)], { deliveryFee: 150 }),
    paymentMethod: 'online',
    paymentStatus: 'paid',
    riderId: 'rider-002',
    notes: '',
    slip: null,
    statusHistory: [
      { status: 'pending', at: hoursAgo(1.5), by: 'system' },
      { status: 'confirmed', at: hoursAgo(1.4), by: 'Admin User' },
      { status: 'preparing', at: hoursAgo(1.2), by: 'Kitchen' },
      { status: 'rider_assigned', at: hoursAgo(1), by: 'Admin User' },
    ],
    createdAt: hoursAgo(1.5),
    updatedAt: hoursAgo(1),
  },
  {
    id: 'ord-005',
    orderNumber: 'YK-1005',
    channel: 'ONLINE',
    type: 'DELIVERY',
    status: 'out_for_delivery',
    customer: {
      name: 'Fatima Zahra',
      phone: '+92 312 9998877',
      address: 'PECHS, Block 2, Karachi',
    },
    items: [buildOrderItem('item-003', 1), buildOrderItem('item-018', 4)],
    ...calcTotals([buildOrderItem('item-003', 1), buildOrderItem('item-018', 4)], { deliveryFee: 150 }),
    paymentMethod: 'online',
    paymentStatus: 'paid',
    riderId: 'rider-001',
    notes: '',
    slip: null,
    statusHistory: [
      { status: 'pending', at: hoursAgo(2), by: 'system' },
      { status: 'confirmed', at: hoursAgo(1.9), by: 'Admin User' },
      { status: 'preparing', at: hoursAgo(1.7), by: 'Kitchen' },
      { status: 'rider_assigned', at: hoursAgo(1.5), by: 'Admin User' },
      { status: 'out_for_delivery', at: hoursAgo(1.2), by: 'Ahmed Khan' },
    ],
    createdAt: hoursAgo(2),
    updatedAt: hoursAgo(1.2),
  },
  {
    id: 'ord-006',
    orderNumber: 'YK-1006',
    channel: 'ONLINE',
    type: 'DELIVERY',
    status: 'delivered',
    customer: {
      name: 'Imran Siddiqui',
      phone: '+92 301 5556677',
      address: 'Clifton Block 8, Karachi',
    },
    items: [buildOrderItem('item-011', 2), buildOrderItem('item-016', 1)],
    ...calcTotals([buildOrderItem('item-011', 2), buildOrderItem('item-016', 1)], { deliveryFee: 150 }),
    paymentMethod: 'online',
    paymentStatus: 'paid',
    riderId: 'rider-001',
    notes: '',
    slip: null,
    statusHistory: [
      { status: 'pending', at: hoursAgo(5), by: 'system' },
      { status: 'confirmed', at: hoursAgo(4.8), by: 'Admin User' },
      { status: 'preparing', at: hoursAgo(4.5), by: 'Kitchen' },
      { status: 'rider_assigned', at: hoursAgo(4.2), by: 'Admin User' },
      { status: 'out_for_delivery', at: hoursAgo(4), by: 'Ahmed Khan' },
      { status: 'delivered', at: hoursAgo(3.5), by: 'Ahmed Khan' },
    ],
    createdAt: hoursAgo(5),
    updatedAt: hoursAgo(3.5),
  },
  {
    id: 'ord-007',
    orderNumber: 'YK-1007',
    channel: 'ONLINE',
    type: 'DELIVERY',
    status: 'cancelled',
    customer: {
      name: 'Nadia Khan',
      phone: '+92 322 3334455',
      address: 'Malir, Karachi',
    },
    items: [buildOrderItem('item-009', 1)],
    ...calcTotals([buildOrderItem('item-009', 1)], { deliveryFee: 150 }),
    paymentMethod: 'online',
    paymentStatus: 'refunded',
    riderId: null,
    notes: 'Customer requested cancellation',
    slip: null,
    statusHistory: [
      { status: 'pending', at: hoursAgo(8), by: 'system' },
      { status: 'cancelled', at: hoursAgo(7.8), by: 'Admin User' },
    ],
    createdAt: hoursAgo(8),
    updatedAt: hoursAgo(7.8),
  },
  {
    id: 'ord-008',
    orderNumber: 'YK-1008',
    channel: 'IN_RESTAURANT',
    type: 'DINE_IN',
    status: 'placed',
    customer: { name: 'Walk-in Guest', phone: '' },
    items: [buildOrderItem('item-008', 1), buildOrderItem('item-018', 2)],
    ...calcTotals([buildOrderItem('item-008', 1), buildOrderItem('item-018', 2)]),
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    tableNumber: 'T-07',
    tokenNumber: 'T-048',
    cashierName: 'Front Cashier',
    notes: '',
    slip: null,
    statusHistory: [{ status: 'placed', at: minutesAgo(12), by: 'Front Cashier' }],
    createdAt: minutesAgo(12),
    updatedAt: minutesAgo(12),
  },
  {
    id: 'ord-009',
    orderNumber: 'YK-1009',
    channel: 'IN_RESTAURANT',
    type: 'DINE_IN',
    status: 'preparing',
    customer: { name: 'Ali Raza', phone: '+92 300 8889900' },
    items: [buildOrderItem('item-001', 1), buildOrderItem('item-005', 1), buildOrderItem('item-015', 2)],
    ...calcTotals([buildOrderItem('item-001', 1), buildOrderItem('item-005', 1), buildOrderItem('item-015', 2)]),
    paymentMethod: 'card',
    paymentStatus: 'paid',
    tableNumber: 'T-03',
    tokenNumber: 'T-046',
    cashierName: 'Front Cashier',
    notes: 'Medium spice',
    slip: null,
    statusHistory: [
      { status: 'placed', at: minutesAgo(25), by: 'Front Cashier' },
      { status: 'preparing', at: minutesAgo(22), by: 'Kitchen' },
    ],
    createdAt: minutesAgo(25),
    updatedAt: minutesAgo(22),
  },
  {
    id: 'ord-010',
    orderNumber: 'YK-1010',
    channel: 'IN_RESTAURANT',
    type: 'TAKEAWAY',
    status: 'ready',
    customer: { name: 'Hina Sheikh', phone: '+92 333 1212121' },
    items: [buildOrderItem('item-012', 3), buildOrderItem('item-020', 3)],
    ...calcTotals([buildOrderItem('item-012', 3), buildOrderItem('item-020', 3)]),
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    tokenNumber: 'T-045',
    cashierName: 'Store Manager',
    notes: 'Pack separately',
    slip: null,
    statusHistory: [
      { status: 'placed', at: minutesAgo(40), by: 'Store Manager' },
      { status: 'preparing', at: minutesAgo(35), by: 'Kitchen' },
      { status: 'ready', at: minutesAgo(28), by: 'Kitchen' },
    ],
    createdAt: minutesAgo(40),
    updatedAt: minutesAgo(28),
  },
  {
    id: 'ord-011',
    orderNumber: 'YK-1011',
    channel: 'IN_RESTAURANT',
    type: 'DINE_IN',
    status: 'served',
    customer: { name: 'Family Table', phone: '' },
    items: [buildOrderItem('item-009', 1), buildOrderItem('item-010', 1), buildOrderItem('item-004', 2)],
    ...calcTotals([buildOrderItem('item-009', 1), buildOrderItem('item-010', 1), buildOrderItem('item-004', 2)]),
    paymentMethod: 'card',
    paymentStatus: 'paid',
    tableNumber: 'T-12',
    tokenNumber: 'T-044',
    cashierName: 'Front Cashier',
    notes: '',
    slip: null,
    statusHistory: [
      { status: 'placed', at: hoursAgo(1.5), by: 'Front Cashier' },
      { status: 'preparing', at: hoursAgo(1.4), by: 'Kitchen' },
      { status: 'ready', at: hoursAgo(1.2), by: 'Kitchen' },
      { status: 'served', at: hoursAgo(1), by: 'Front Cashier' },
    ],
    createdAt: hoursAgo(1.5),
    updatedAt: hoursAgo(1),
  },
  {
    id: 'ord-012',
    orderNumber: 'YK-1012',
    channel: 'IN_RESTAURANT',
    type: 'TAKEAWAY',
    status: 'cancelled',
    customer: { name: 'Kamran Ali', phone: '+92 345 6667788' },
    items: [buildOrderItem('item-013', 2)],
    ...calcTotals([buildOrderItem('item-013', 2)]),
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    tokenNumber: 'T-043',
    cashierName: 'Front Cashier',
    notes: 'Customer left before pickup',
    slip: null,
    statusHistory: [
      { status: 'placed', at: hoursAgo(3), by: 'Front Cashier' },
      { status: 'cancelled', at: hoursAgo(2.8), by: 'Store Manager' },
    ],
    createdAt: hoursAgo(3),
    updatedAt: hoursAgo(2.8),
  },
  {
    id: 'ord-013',
    orderNumber: 'YK-1013',
    channel: 'ONLINE',
    type: 'DELIVERY',
    status: 'pending',
    customer: {
      name: 'Zainab Qureshi',
      phone: '+92 300 4445566',
      email: 'zainab@email.com',
      address: 'Scheme 33, Karachi',
    },
    items: [buildOrderItem('item-020', 2), buildOrderItem('item-014', 1)],
    ...calcTotals([buildOrderItem('item-020', 2), buildOrderItem('item-014', 1)], { deliveryFee: 150 }),
    paymentMethod: 'online',
    paymentStatus: 'paid',
    riderId: null,
    notes: '',
    slip: null,
    statusHistory: [{ status: 'pending', at: minutesAgo(3), by: 'system' }],
    createdAt: minutesAgo(3),
    updatedAt: minutesAgo(3),
  },
];

export let slips = [];

function createSlipRecord(order, slipType = 'kitchen') {
  const slip = {
    id: nextId('slip'),
    orderId: order.id,
    orderNumber: order.orderNumber,
    slipType,
    tokenNumber: order.tokenNumber ?? null,
    tableNumber: order.tableNumber ?? null,
    items: order.items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      notes: i.notes ?? '',
    })),
    customerName: order.customer?.name ?? 'Guest',
    channel: order.channel,
    orderType: order.type,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    subtotal: order.subtotal,
    tax: order.tax,
    serviceCharge: order.serviceCharge,
    total: order.total,
    footer: settings.slipFooter,
    printedAt: new Date().toISOString(),
    reprintCount: 0,
    createdAt: new Date().toISOString(),
  };
  slips.push(slip);
  return slip;
}

orders
  .filter((o) => ['delivered', 'served', 'ready', 'out_for_delivery', 'preparing'].includes(o.status))
  .forEach((order) => {
    const slip = createSlipRecord(order, order.channel === 'ONLINE' ? 'delivery' : 'kitchen');
    order.slip = { id: slip.id, slipType: slip.slipType, printedAt: slip.printedAt };
  });

export function getCategories() {
  return categories;
}

export function getMenuItems() {
  return menuItems;
}

export function getRiders() {
  return riders;
}

export function getDeliveryLocations() {
  return deliveryLocations;
}

export function getOrders() {
  return orders;
}

export function getSlips() {
  return slips;
}

export function getSettings() {
  return settings;
}

export function getHeroContent() {
  syncHeroTopDeals();
  return heroContent;
}

export function syncCategoryItemCounts() {
  categories = categories.map((cat) => ({
    ...cat,
    itemCount: menuItems.filter((item) => item.categoryId === cat.id && item.active).length,
  }));
}

syncCategoryItemCounts();

export const salesSummaryMock = {
  daily: {
    range: 'daily',
    from: daysAgo(1),
    to: now.toISOString(),
    totalRevenue: 87450,
    totalOrders: 42,
    averageOrderValue: 2082,
    channels: {
      ONLINE: { revenue: 52100, orders: 24, percentage: 59.6 },
      IN_RESTAURANT: { revenue: 35350, orders: 18, percentage: 40.4 },
    },
    paymentMethods: {
      cash: 18400,
      card: 22100,
      online: 46950,
    },
    topItems: [
      { menuItemId: 'item-001', name: 'Chicken Biryani', quantity: 18, revenue: 10782 },
      { menuItemId: 'item-008', name: 'Chicken Karahi', quantity: 12, revenue: 17400 },
      { menuItemId: 'item-012', name: 'Crispy Chicken Burger', quantity: 15, revenue: 7185 },
    ],
  },
  weekly: {
    range: 'weekly',
    from: daysAgo(7),
    to: now.toISOString(),
    totalRevenue: 542800,
    totalOrders: 268,
    averageOrderValue: 2025,
    channels: {
      ONLINE: { revenue: 318400, orders: 156, percentage: 58.7 },
      IN_RESTAURANT: { revenue: 224400, orders: 112, percentage: 41.3 },
    },
    paymentMethods: {
      cash: 112600,
      card: 134200,
      online: 296000,
    },
    topItems: [
      { menuItemId: 'item-001', name: 'Chicken Biryani', quantity: 98, revenue: 58702 },
      { menuItemId: 'item-005', name: 'Chicken Tikka', quantity: 72, revenue: 50328 },
      { menuItemId: 'item-002', name: 'Beef Biryani', quantity: 45, revenue: 38250 },
    ],
  },
  monthly: {
    range: 'monthly',
    from: daysAgo(30),
    to: now.toISOString(),
    totalRevenue: 2185600,
    totalOrders: 1042,
    averageOrderValue: 2097,
    channels: {
      ONLINE: { revenue: 1298400, orders: 612, percentage: 59.4 },
      IN_RESTAURANT: { revenue: 887200, orders: 430, percentage: 40.6 },
    },
    paymentMethods: {
      cash: 456800,
      card: 542400,
      online: 1186400,
    },
    topItems: [
      { menuItemId: 'item-001', name: 'Chicken Biryani', quantity: 412, revenue: 246788 },
      { menuItemId: 'item-008', name: 'Chicken Karahi', quantity: 286, revenue: 414700 },
      { menuItemId: 'item-012', name: 'Crispy Chicken Burger', quantity: 310, revenue: 148490 },
    ],
  },
  byDay: Array.from({ length: 14 }, (_, i) => {
    const date = daysAgo(13 - i);
    const dayOrders = 28 + (i % 5) * 3;
    const revenue = dayOrders * (1900 + (i % 4) * 120);
    return {
      date: date.slice(0, 10),
      orders: dayOrders,
      revenue,
      online: Math.round(revenue * 0.58),
      inRestaurant: Math.round(revenue * 0.42),
    };
  }),
  byCategory: categories.map((cat, i) => ({
    categoryId: cat.id,
    name: cat.name,
    orders: 120 - i * 12,
    revenue: (120 - i * 12) * (800 + i * 100),
    percentage: Math.round((20 - i * 2.5) * 10) / 10,
  })),
  byItem: menuItems.slice(0, 10).map((item, i) => ({
    menuItemId: item.id,
    name: item.name,
    categoryId: item.categoryId,
    quantity: 95 - i * 7,
    revenue: (95 - i * 7) * (item.discountPrice ?? item.price),
  })),
};

export { createSlipRecord, buildOrderItem, calcTotals };
