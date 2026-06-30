// src/db/supabaseDb.js
// Supabase database adapter layer.
// All functions are async and map directly to Supabase table operations.
// When SUPABASE_ENABLED is false, every function delegates to the
// localStorage-based db.js layer so the app always works offline too.

import { supabase, SUPABASE_ENABLED } from './supabaseClient';
import * as localDb from './db';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function generateId(prefix = '') {
  return prefix + Math.random().toString(36).substr(2, 9);
}

function generateUuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function nowISO() {
  return new Date().toISOString();
}

// Convert a Supabase property row (snake_case) → app shape (camelCase)
function mapProperty(row) {
  if (!row) return null;
  return {
    id:              row.id,
    title:           row.title,
    description:     row.description,
    category:        row.category,
    pricePerNight:   Number(row.price_per_night),
    beds:            row.beds,
    baths:           row.baths,
    guests:          row.guests,
    location:        row.location,
    amenities:       row.amenities       || [],
    seasonalPricing: row.seasonal_pricing || [],
    discounts:       row.discounts        || [],
    status:          row.status,
    createdAt:       row.created_at,
  };
}

function mapBooking(row) {
  if (!row) return null;
  return {
    id:          row.id,
    propertyId:  row.property_id,
    unitId:      row.unit_id,
    userId:      row.user_id,
    checkIn:     row.check_in,
    checkOut:    row.check_out,
    totalPrice:  Number(row.total_price),
    totalAmount: Number(row.total_amount || row.total_price),
    paymentStatus: row.payment_status || 'pending',
    bookingStatus: row.booking_status || row.status,
    status:      row.status,
    guestsCount: row.guests_count,
    createdAt:   row.created_at,
  };
}

function mapPropertyUnit(row) {
  if (!row) return null;
  return {
    id:            row.id,
    propertyId:    row.property_id,
    unitName:      row.unit_name,
    unitType:      row.unit_type,
    description:   row.description,
    maxGuests:     Number(row.max_guests),
    pricePerNight: Number(row.price_per_night),
    status:        row.status,
    photoUrl:      row.photo_url,
    createdAt:     row.created_at,
    updatedAt:     row.updated_at
  };
}

function mapPayment(row) {
  if (!row) return null;
  return {
    id:             row.id,
    bookingId:      row.booking_id,
    userId:         row.user_id,
    transactionId:  row.transaction_id || row.transaction_ref,
    paymentMethod:  row.payment_method || row.method,
    amount:         Number(row.amount),
    currency:       row.currency || 'PHP',
    paymentStatus:  row.payment_status || row.status,
    paidAt:         row.paid_at,
    createdAt:      row.created_at,
    bookingNumber:  row.booking_number,
    propertyTitle:  row.property_title,
    unitName:       row.unit_name,
    checkIn:        row.check_in,
    checkOut:       row.check_out,
  };
}

function mapImage(row) {
  if (!row) return null;
  return {
    id:         row.id,
    propertyId: row.property_id,
    url:        row.url,
    isCover:    row.is_cover,
    createdAt:  row.created_at,
  };
}

function mapReview(row) {
  if (!row) return null;
  return {
    id:         row.id,
    propertyId: row.property_id,
    userId:     row.user_id,
    rating:     Number(row.rating),
    comment:    row.comment,
    response:   row.response || '',
    createdAt:  row.created_at,
  };
}

function mapNotification(row) {
  if (!row) return null;
  return {
    id:        row.id,
    userId:    row.user_id,
    message:   row.message,
    type:      row.type,
    read:      row.read,
    createdAt: row.created_at,
  };
}

function mapLog(row) {
  if (!row) return null;
  return {
    id:        row.id,
    adminId:   row.admin_id,
    action:    row.action,
    details:   row.details,
    timestamp: row.timestamp,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// READ functions
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchProperties() {
  if (!SUPABASE_ENABLED) return localDb.getTable('properties');
  const { data, error } = await supabase.from('properties').select('*').order('created_at', { ascending: true });
  if (error) {
    console.error('[fetchProperties] Supabase error:', error.message);
    throw error;
  }
  const mapped = (data || []).map(mapProperty);
  console.log('[fetchProperties] Returned', mapped.length, 'properties:', mapped.map(p => ({ id: p.id, title: p.title, status: p.status })));
  return mapped;
}

export async function fetchPropertyImages() {
  if (!SUPABASE_ENABLED) return localDb.getTable('property_images');
  const { data, error } = await supabase.from('property_images').select('*');
  if (error) throw error;
  return (data || []).map(mapImage);
}

export async function fetchBookings() {
  if (!SUPABASE_ENABLED) return localDb.getTable('bookings');
  const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapBooking);
}

export async function fetchPayments() {
  if (!SUPABASE_ENABLED) return localDb.getTable('payments');
  const { data, error } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapPayment);
}

export async function fetchReviews() {
  if (!SUPABASE_ENABLED) return localDb.getTable('reviews');
  const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapReview);
}

export async function fetchAmenities() {
  if (!SUPABASE_ENABLED) return localDb.getTable('amenities');
  const { data, error } = await supabase.from('amenities').select('*');
  if (error) throw error;
  return data || [];
}

export async function fetchNotifications() {
  if (!SUPABASE_ENABLED) return localDb.getTable('notifications');
  const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapNotification);
}

export async function fetchActivityLogs() {
  if (!SUPABASE_ENABLED) return localDb.getTable('activity_logs');
  const { data, error } = await supabase.from('activity_logs').select('*').order('timestamp', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapLog);
}

export async function fetchSettings() {
  if (!SUPABASE_ENABLED) return localDb.getTable('settings');
  const { data, error } = await supabase.from('settings').select('*');
  if (error) throw error;
  // Convert key-value rows → single settings object
  const obj = {};
  (data || []).forEach(row => {
    obj[row.key] = typeof row.value === 'string' ? row.value : row.value;
  });
  return obj;
}

export async function fetchUsers() {
  if (!SUPABASE_ENABLED) return localDb.getTable('users');
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw error;
  return data || [];
}

export async function fetchAdmins() {
  if (!SUPABASE_ENABLED) return localDb.getTable('admins');
  const { data, error } = await supabase.from('admins').select('*');
  if (error) throw error;
  return data || [];
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH functions
// ─────────────────────────────────────────────────────────────────────────────

export async function loginUserDb(email, password) {
  if (!SUPABASE_ENABLED) {
    const users = localDb.getTable('users');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) throw new Error('Invalid email or password.');
    return user;
  }
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('password_hash', password)
    .single();
  if (error || !data) throw new Error('Invalid email or password.');
  return data;
}

export async function loginAdminDb(email, password) {
  if (!SUPABASE_ENABLED) {
    const admins = localDb.getTable('admins');
    const admin = admins.find(a => a.email.toLowerCase() === email.toLowerCase() && a.password === password);
    if (!admin) throw new Error('Invalid administrator credentials.');
    return admin;
  }

  let { data, error } = await supabase
    .from('admins')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('password_hash', password)
    .single();

  if (!error && data) return data;

  const userResult = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('password_hash', password)
    .in('role', ['admin', 'host'])
    .single();

  if (userResult.error || !userResult.data) {
    throw new Error('Invalid administrator credentials.');
  }

  const roleLabel = userResult.data.role === 'host' ? 'Manager' : 'Super Admin';
  return { ...userResult.data, role: roleLabel };
}

export async function registerAdminDb(adminData) {
  if (!SUPABASE_ENABLED) {
    return localDb.insertRecord('admins', {
      name: adminData.name,
      email: adminData.email.toLowerCase(),
      password: adminData.password,
      role: adminData.role || 'Super Admin'
    });
  }

  const roleForDb = adminData.role === 'Manager' ? 'host' : 'admin';

  const newUser = {
    id: generateUuid(),
    name: adminData.name,
    email: adminData.email.toLowerCase(),
    password_hash: adminData.password,
    role: roleForDb,
    verified: true,
    created_at: nowISO()
  };

  const { data, error } = await supabase.from('users').insert(newUser).select().single();
  if (error) throw new Error(error.message);
  return { ...data, role: adminData.role || 'Super Admin' };
}

export async function registerUserDb(name, email, password, phone) {
  if (!SUPABASE_ENABLED) {
    const users = localDb.getTable('users');
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account with this email already exists.');
    }
    return localDb.insertRecord('users', { name, email: email.toLowerCase(), password, phone,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      verified: true });
  }
  // Check duplicate
  const { data: existing } = await supabase.from('users').select('id').eq('email', email.toLowerCase()).maybeSingle();
  if (existing) throw new Error('An account with this email already exists.');

  const newUser = {
    id:       generateUuid(),
    name,
    email:    email.toLowerCase(),
    password_hash: password,
    phone,
    avatar:   'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    verified: true,
    created_at: nowISO(),
  };
  const { data, error } = await supabase.from('users').insert(newUser).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function changeAdminPasswordDb(adminId, oldPassword, newPassword) {
  if (!SUPABASE_ENABLED) {
    const admins = localDb.getTable('admins');
    const admin = admins.find(a => a.id === adminId);
    if (!admin || admin.password !== oldPassword) throw new Error('Incorrect current password.');
    localDb.updateRecord('admins', adminId, { password: newPassword });
    return;
  }
  const { data: admin, error: fetchErr } = await supabase.from('users').select('password_hash').eq('id', adminId).single();
  if (fetchErr || !admin) throw new Error('Admin not found.');
  if (admin.password_hash !== oldPassword) throw new Error('Incorrect current password.');
  const { error } = await supabase.from('users').update({ password_hash: newPassword }).eq('id', adminId);
  if (error) throw new Error(error.message);
}

// ─────────────────────────────────────────────────────────────────────────────
// PROPERTY functions
// ─────────────────────────────────────────────────────────────────────────────

export async function insertPropertyDb(propData, coverUrl, secondaryUrls = []) {
  if (!SUPABASE_ENABLED) {
    const p = localDb.insertRecord('properties', {
      title: propData.title, description: propData.description, category: propData.category,
      pricePerNight: Number(propData.pricePerNight), beds: Number(propData.beds),
      baths: Number(propData.baths), guests: Number(propData.guests),
      location: propData.location, amenities: propData.amenities || [],
      status: propData.status || 'available',
      seasonalPricing: propData.seasonalPricing || [], discounts: propData.discounts || []
    });
    localDb.insertRecord('property_images', { propertyId: p.id, url: coverUrl || '', isCover: true });
    secondaryUrls.filter(u => u).forEach(url => {
      localDb.insertRecord('property_images', { propertyId: p.id, url, isCover: false });
    });
    return p;
  }

  const newProp = {
    id: generateUuid(),
    title: propData.title,
    description: propData.description,
    category: propData.category,
    price_per_night: Number(propData.pricePerNight),
    beds: Number(propData.beds),
    baths: Number(propData.baths),
    guests: Number(propData.guests),
    location: propData.location,
    amenities: propData.amenities || [],
    seasonal_pricing: propData.seasonalPricing || [],
    discounts: propData.discounts || [],
    status: propData.status || 'available',
  };

  const { data, error } = await supabase.from('properties').insert(newProp).select().single();
  if (error) throw new Error(error.message);

  // Insert cover image
  const imgs = [{ id: generateUuid(), property_id: data.id, url: coverUrl || '', is_cover: true }];
  secondaryUrls.filter(u => u).forEach(url => {
    imgs.push({ id: generateUuid(), property_id: data.id, url, is_cover: false });
  });
  await supabase.from('property_images').insert(imgs);

  return mapProperty(data);
}

export async function updatePropertyDb(id, propData, coverUrl, secondaryUrls = []) {
  if (!SUPABASE_ENABLED) {
    localDb.updateRecord('properties', id, {
      title: propData.title, description: propData.description, category: propData.category,
      pricePerNight: Number(propData.pricePerNight), beds: Number(propData.beds),
      baths: Number(propData.baths), guests: Number(propData.guests),
      location: propData.location, amenities: propData.amenities || [],
      status: propData.status || 'available',
      seasonalPricing: propData.seasonalPricing || [], discounts: propData.discounts || []
    });
    const allImgs = localDb.getTable('property_images').filter(img => img.propertyId !== id);
    allImgs.push({ id: generateId('pi'), propertyId: id, url: coverUrl, isCover: true });
    secondaryUrls.filter(u => u).forEach(url => allImgs.push({ id: generateId('pi'), propertyId: id, url, isCover: false }));
    localDb.saveTable('property_images', allImgs);
    return;
  }

  const { error: propErr } = await supabase.from('properties').update({
    title: propData.title,
    description: propData.description,
    category: propData.category,
    price_per_night: Number(propData.pricePerNight),
    beds: Number(propData.beds),
    baths: Number(propData.baths),
    guests: Number(propData.guests),
    location: propData.location,
    amenities: propData.amenities || [],
    seasonal_pricing: propData.seasonalPricing || [],
    discounts: propData.discounts || [],
    status: propData.status || 'available',
  }).eq('id', id);
  if (propErr) throw new Error(propErr.message);

  // Replace images: delete old ones then re-insert
  await supabase.from('property_images').delete().eq('property_id', id);
  const imgs = [{ id: generateUuid(), property_id: id, url: coverUrl || '', is_cover: true }];
  secondaryUrls.filter(u => u).forEach(url => imgs.push({ id: generateUuid(), property_id: id, url, is_cover: false }));
  await supabase.from('property_images').insert(imgs);
}

export async function archivePropertyDb(id) {
  if (!SUPABASE_ENABLED) {
    localDb.updateRecord('properties', id, { status: 'archived' });
    return;
  }
  const { error } = await supabase.from('properties').update({ status: 'archived' }).eq('id', id);
  if (error) throw new Error(error.message);
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOKING functions
// ─────────────────────────────────────────────────────────────────────────────

export async function checkDoubleBookingDb(propertyId, unitId, checkIn, checkOut, excludeId = null) {
  if (!SUPABASE_ENABLED) {
    return localDb.hasDoubleBooking(propertyId, unitId, checkIn, checkOut, excludeId);
  }
  
  // Fetch active bookings for this property that overlap
  let query = supabase
    .from('bookings')
    .select('id, unit_id')
    .eq('property_id', propertyId)
    .not('status', 'in', '("cancelled","rejected")')
    .lt('check_in', checkOut)
    .gt('check_out', checkIn);
  if (excludeId) query = query.neq('id', excludeId);
  const { data: bookingsData, error: bookingsErr } = await query;
  if (bookingsErr) throw new Error(bookingsErr.message);

  if ((bookingsData || []).length === 0) return false;

  // Fetch unit definitions to check unit types
  const { data: unitsData, error: unitsErr } = await supabase
    .from('property_units')
    .select('id, unit_type')
    .eq('property_id', propertyId);
  if (unitsErr) throw new Error(unitsErr.message);

  const targetUnit = (unitsData || []).find(u => u.id === unitId);
  if (!targetUnit) return false;

  // Rule 1: If there is any booking in this period for an 'Entire Property' unit:
  const hasEntirePropertyBooking = (bookingsData || []).some(b => {
    const unit = (unitsData || []).find(u => u.id === b.unit_id);
    return unit && unit.unit_type === 'Entire Property';
  });
  if (hasEntirePropertyBooking) return true;

  // Rule 2/3: If we are booking the 'Entire Property':
  if (targetUnit.unit_type === 'Entire Property') {
    if ((bookingsData || []).length > 0) return true;
  }

  // Rule 4: If we are booking a specific 'Room':
  if (targetUnit.unit_type === 'Room') {
    const isRoomBooked = (bookingsData || []).some(b => b.unit_id === unitId);
    if (isRoomBooked) return true;
  }

  return false;
}

export async function insertBookingDb(bookingData) {
  const statusVal = bookingData.status || 'pending';
  const payStatusVal = bookingData.paymentStatus || 'pending';
  const totalAmtVal = bookingData.totalAmount || bookingData.totalPrice;

  if (!SUPABASE_ENABLED) {
    return localDb.insertRecord('bookings', {
      propertyId:    bookingData.propertyId,
      unitId:        bookingData.unitId,
      userId:        bookingData.userId,
      checkIn:       bookingData.checkIn,
      checkOut:      bookingData.checkOut,
      totalPrice:    bookingData.totalPrice,
      totalAmount:   totalAmtVal,
      paymentStatus: payStatusVal,
      bookingStatus: statusVal,
      status:         statusVal,
      guestsCount:   bookingData.guestsCount
    });
  }
  const row = {
    id:             generateUuid(),
    property_id:    bookingData.propertyId,
    unit_id:        bookingData.unitId,
    user_id:        bookingData.userId,
    check_in:       bookingData.checkIn,
    check_out:      bookingData.checkOut,
    total_price:    bookingData.totalPrice,
    total_amount:   totalAmtVal,
    payment_status: payStatusVal,
    booking_status: statusVal,
    status:         statusVal,
    guests_count:   bookingData.guestsCount,
    created_at:     nowISO(),
    updated_at:     nowISO()
  };
  const { data, error } = await supabase.from('bookings').insert(row).select().single();
  if (error) throw new Error(error.message);
  return mapBooking(data);
}

export async function updateBookingStatusDb(bookingId, status) {
  if (!SUPABASE_ENABLED) {
    localDb.updateRecord('bookings', bookingId, { status });
    return;
  }
  const { error } = await supabase.from('bookings').update({ status }).eq('id', bookingId);
  if (error) throw new Error(error.message);
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT functions
// ─────────────────────────────────────────────────────────────────────────────

export async function insertPaymentDb(paymentData) {
  if (!SUPABASE_ENABLED) {
    return localDb.insertRecord('payments', {
      bookingId: paymentData.bookingId,
      userId: paymentData.userId,
      amount: paymentData.amount,
      paymentMethod: paymentData.paymentMethod || paymentData.method,
      paymentStatus: 'pending',
      transactionId: 'TXN-' + Math.floor(1000000 + Math.random() * 9000000),
      currency: 'PHP'
    });
  }
  const row = {
    id:              generateUuid(),
    booking_id:      paymentData.bookingId,
    user_id:         paymentData.userId,
    amount:          paymentData.amount,
    payment_method:  paymentData.paymentMethod || paymentData.method || 'gcash',
    payment_status:  'pending',
    transaction_id:  'TXN-' + Math.floor(1000000 + Math.random() * 9000000),
    currency:        'PHP',
    gateway_response: {},
  };
  const { data, error } = await supabase.from('payments').insert(row).select().single();
  if (error) throw new Error(error.message);
  return mapPayment(data);
}

export async function updatePaymentStatusDb(paymentId, status) {
  if (!SUPABASE_ENABLED) {
    localDb.updateRecord('payments', paymentId, { paymentStatus: status, payment_status: status });
    return;
  }
  const { error } = await supabase.from('payments').update({ 
    payment_status: status,
    paid_at: status === 'paid' ? nowISO() : undefined
  }).eq('id', paymentId);
  if (error) throw new Error(error.message);
}

// ─────────────────────────────────────────────────────────────────────────────
// REVIEW functions
// ─────────────────────────────────────────────────────────────────────────────

export async function insertReviewDb(reviewData) {
  if (!SUPABASE_ENABLED) {
    return localDb.insertRecord('reviews', {
      propertyId: reviewData.propertyId, userId: reviewData.userId,
      rating: reviewData.rating, comment: reviewData.comment, response: ''
    });
  }
  const row = {
    id:          generateUuid(),
    property_id: reviewData.propertyId,
    user_id:     reviewData.userId,
    rating:      reviewData.rating,
    comment:     reviewData.comment,
    response:    '',
  };
  const { data, error } = await supabase.from('reviews').insert(row).select().single();
  if (error) throw new Error(error.message);
  return mapReview(data);
}

export async function updateReviewResponseDb(reviewId, response) {
  if (!SUPABASE_ENABLED) {
    localDb.updateRecord('reviews', reviewId, { response });
    return;
  }
  const { error } = await supabase.from('reviews').update({ response }).eq('id', reviewId);
  if (error) throw new Error(error.message);
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION functions
// ─────────────────────────────────────────────────────────────────────────────

export async function insertNotificationDb(notifData) {
  if (!SUPABASE_ENABLED) {
    return localDb.insertRecord('notifications', notifData);
  }
  const row = {
    id:       generateUuid(),
    user_id:  notifData.userId,
    message:  notifData.message,
    type:     notifData.type || 'info',
    read:     false,
  };
  const { error } = await supabase.from('notifications').insert(row);
  if (error) console.error('[Notification insert error]', error.message);
}

export async function markNotificationsReadDb(userId) {
  if (!SUPABASE_ENABLED) {
    const list = localDb.getTable('notifications').map(n => n.userId === userId ? { ...n, read: true } : n);
    localDb.saveTable('notifications', list);
    return;
  }
  await supabase.from('notifications').update({ read: true }).eq('user_id', userId);
}

export async function clearNotificationsDb(userId) {
  if (!SUPABASE_ENABLED) {
    localDb.saveTable('notifications', localDb.getTable('notifications').filter(n => n.userId !== userId));
    return;
  }
  await supabase.from('notifications').delete().eq('user_id', userId);
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY LOG functions
// ─────────────────────────────────────────────────────────────────────────────

export async function insertActivityLogDb(adminId, action, details) {
  if (!SUPABASE_ENABLED) {
    localDb.logActivity(adminId, action, details);
    return;
  }
  const row = { id: generateUuid(), admin_id: adminId, action, details };
  await supabase.from('activity_logs').insert(row);
}

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS functions
// ─────────────────────────────────────────────────────────────────────────────

export async function updateSettingsDb(newSettings) {
  if (!SUPABASE_ENABLED) {
    const current = localDb.getTable('settings');
    localDb.saveTable('settings', { ...current, ...newSettings });
    return;
  }
  // Upsert each key-value pair individually
  const upserts = Object.entries(newSettings).map(([key, value]) => ({
    key,
    value: typeof value === 'string' ? JSON.parse(JSON.stringify(value)) : value,
  }));
  for (const row of upserts) {
    await supabase.from('settings').upsert(row, { onConflict: 'key' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PROPERTY UNITS functions
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchPropertyUnits() {
  if (!SUPABASE_ENABLED) return localDb.getTable('property_units');
  const { data, error } = await supabase.from('property_units').select('*').order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapPropertyUnit);
}

export async function insertPropertyUnitDb(unitData) {
  if (!SUPABASE_ENABLED) {
    return localDb.insertRecord('property_units', {
      propertyId:    unitData.propertyId,
      unitName:      unitData.unitName,
      unitType:      unitData.unitType,
      description:   unitData.description,
      maxGuests:     Number(unitData.maxGuests),
      pricePerNight: Number(unitData.pricePerNight),
      status:        unitData.status || 'available',
      photoUrl:      unitData.photoUrl || ''
    });
  }

  const row = {
    id:              generateUuid(),
    property_id:     unitData.propertyId,
    unit_name:       unitData.unitName,
    unit_type:       unitData.unitType,
    description:     unitData.description,
    max_guests:      Number(unitData.maxGuests),
    price_per_night: Number(unitData.pricePerNight),
    status:          unitData.status || 'available',
    photo_url:       unitData.photoUrl || '',
    created_at:      nowISO(),
    updated_at:      nowISO()
  };
  const { data, error } = await supabase.from('property_units').insert(row).select().single();
  if (error) throw new Error(error.message);
  return mapPropertyUnit(data);
}

export async function updatePropertyUnitDb(id, unitData) {
  if (!SUPABASE_ENABLED) {
    return localDb.updateRecord('property_units', id, {
      unitName:      unitData.unitName,
      unitType:      unitData.unitType,
      description:   unitData.description,
      maxGuests:     Number(unitData.maxGuests),
      pricePerNight: Number(unitData.pricePerNight),
      status:        unitData.status,
      photoUrl:      unitData.photoUrl
    });
  }

  const { error } = await supabase.from('property_units').update({
    unit_name:       unitData.unitName,
    unit_type:       unitData.unitType,
    description:     unitData.description,
    max_guests:      Number(unitData.maxGuests),
    price_per_night: Number(unitData.pricePerNight),
    status:          unitData.status,
    photo_url:       unitData.photoUrl,
    updated_at:      nowISO()
  }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deletePropertyUnitDb(id) {
  if (!SUPABASE_ENABLED) {
    return localDb.deleteRecord('property_units', id);
  }
  const { error } = await supabase.from('property_units').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
