import React, { useState, useEffect } from 'react';
import { DbProvider, useDb } from './context/DbContext';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import CalendarView from './components/CalendarView';
import AnalyticsCharts from './components/AnalyticsCharts';
import * as Icons from 'lucide-react';

function AppContent() {
  const {
    activeRole,
    currentUser,
    currentAdmin,
    properties,
    propertyUnits,
    propertyImages,
    bookings,
    payments,
    reviews,
    amenities,
    activityLogs,
    settings,
    loading,
    supabaseEnabled,
    registerUser,
    loginUser,
    loginAdmin,
    logout,
    changeAdminPassword,
    addProperty,
    updateProperty,
    deleteProperty,
    addPropertyUnit,
    updatePropertyUnit,
    deletePropertyUnit,
    calculateBookingDetails,
    createBooking,
    cancelBooking,
    updateBookingStatus,
    verifyPayment,
    refundPayment,
    getPaymentDashboard,
    getReceiptPdf,
    addReview,
    replyToReview,
    updateSettings
  } = useDb();

  // Show loading spinner while Supabase fetches initial data
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '16px',
        background: 'var(--bg-primary)'
      }}>
        <Icons.Loader size={40} style={{ color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: 600 }}>
          {supabaseEnabled ? 'Connecting to Supabase cloud database…' : 'Loading HavenShare…'}
        </p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Derive initial tab from current URL path
  const getTabFromPath = (path) => {
    if (path === '/login') return 'login';
    if (path === '/register') return 'register';
    if (path.startsWith('/guest/dashboard')) return 'guest_dashboard';
    if (path.startsWith('/admin/dashboard')) return 'admin_dashboard';
    return 'home';
  };

  // Navigation: 'home' | 'property_detail' | 'guest_dashboard' | 'admin_dashboard' | 'admin_properties' | 'admin_units' | 'admin_bookings' | 'admin_payments' | 'admin_settings' | 'admin_logs' | 'payment_success' | 'payment_cancelled'
  const [currentTab, setCurrentTab] = useState(() => getTabFromPath(window.location.pathname));
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [selectedUnitId, setSelectedUnitId] = useState(null);

  // Payment callback state
  const [paymentSuccessBookingId, setPaymentSuccessBookingId] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priceFilter, setPriceFilter] = useState(1000);
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  // Modals state
  const [bookingDates, setBookingDates] = useState({ checkIn: '', checkOut: '', guests: 1 });
  const [bookingError, setBookingError] = useState('');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutMethod, setCheckoutMethod] = useState('Credit Card');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [bookingConfirmedRef, setBookingConfirmedRef] = useState(null);
  const [emailSentModalInfo, setEmailSentModalInfo] = useState(null);

  // Receipt Modal State
  const [selectedReceiptBooking, setSelectedReceiptBooking] = useState(null);

  // Review Modal / Input State
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [reviewError, setReviewError] = useState('');

  // Admin Modals
  const [showPropertyFormModal, setShowPropertyFormModal] = useState(null); // 'add' | propertyId
  const [propFormTitle, setPropFormTitle] = useState('');
  const [propFormDesc, setPropFormDesc] = useState('');
  const [propFormCategory, setPropFormCategory] = useState('Beachfront');
  const [propFormPrice, setPropFormPrice] = useState('');
  const [propFormBeds, setPropFormBeds] = useState('');
  const [propFormBaths, setPropFormBaths] = useState('');
  const [propFormGuests, setPropFormGuests] = useState('');
  const [propFormCity, setPropFormCity] = useState('');
  const [propFormCountry, setPropFormCountry] = useState('');
  const [propFormAddress, setPropFormAddress] = useState('');
  const [propFormAmenities, setPropFormAmenities] = useState([]);
  const [propFormCoverUrl, setPropFormCoverUrl] = useState('');
  const [propFormSecondaryUrls, setPropFormSecondaryUrls] = useState(['', '']);
  const [propFormError, setPropFormError] = useState('');

  // Admin Unit Form Modals
  const [showUnitFormModal, setShowUnitFormModal] = useState(null); // 'add' | unitId
  const [unitFormPropertyId, setUnitFormPropertyId] = useState('');
  const [unitFormName, setUnitFormName] = useState('');
  const [unitFormType, setUnitFormType] = useState('Room');
  const [unitFormDesc, setUnitFormDesc] = useState('');
  const [unitFormMaxGuests, setUnitFormMaxGuests] = useState('2');
  const [unitFormPrice, setUnitFormPrice] = useState('');
  const [unitFormStatus, setUnitFormStatus] = useState('available');
  const [unitFormPhotoUrl, setUnitFormPhotoUrl] = useState('');
  const [unitFormError, setUnitFormError] = useState('');
  const [selectedAdminPropertyId, setSelectedAdminPropertyId] = useState('');

  // Admin Pricing Adjusters
  const [propFormSeasonal, setPropFormSeasonal] = useState([]); // Array of { month: 7, multiplier: 1.4 }
  const [propFormDiscounts, setPropFormDiscounts] = useState([]); // Array of { minDays: 5, percentage: 10 }
  
  // Custom states
  const [newSeasonalMonth, setNewSeasonalMonth] = useState(1);
  const [newSeasonalMult, setNewSeasonalMult] = useState(1.1);
  const [newDiscountDays, setNewDiscountDays] = useState(3);
  const [newDiscountPct, setNewDiscountPct] = useState(5);

  // Review moderation state
  const [reviewReplyId, setReviewReplyId] = useState(null);
  const [reviewReplyText, setReviewReplyText] = useState('');

  // Security password state
  const [oldAdminPass, setOldAdminPass] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [adminPassMessage, setAdminPassMessage] = useState('');

  // Log filter
  const [logSearchQuery, setLogSearchQuery] = useState('');

  // Settings inputs
  const [settingsLogoText, setSettingsLogoText] = useState(settings.logoText || '');
  const [settingsBannerTitle, setSettingsBannerTitle] = useState(settings.bannerTitle || '');
  const [settingsBannerSubtitle, setSettingsBannerSubtitle] = useState(settings.bannerSubtitle || '');
  const [settingsBannerImage, setSettingsBannerImage] = useState(settings.bannerImage || '');
  const [settingsEmail, setSettingsEmail] = useState(settings.contactEmail || '');
  const [settingsPhone, setSettingsPhone] = useState(settings.contactPhone || '');
  const [settingsFaqs, setSettingsFaqs] = useState(settings.faqs || []);

  // Reports state
  const [reportPropId, setReportPropId] = useState('All');
  const [reportUnitId, setReportUnitId] = useState('All');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');

  const handleNavigate = (tab, path = null) => {
    let targetPath = path;
    if (!targetPath) {
      if (tab === 'home') targetPath = '/';
      else if (tab === 'login') targetPath = '/login';
      else if (tab === 'register') targetPath = '/register';
      else if (tab === 'guest_dashboard') targetPath = '/guest/dashboard';
      else if (tab.startsWith('admin')) targetPath = '/admin/dashboard';
      else if (tab === 'property_detail') targetPath = `/property/${selectedPropertyId || ''}`;
      else targetPath = '/';
    }

    // Protected Route Enforcement:
    if (tab === 'guest_dashboard' && !currentUser) {
      targetPath = '/login';
      tab = 'login';
    } else if (tab.startsWith('admin') && activeRole !== 'admin') {
      targetPath = '/login';
      tab = 'login';
    }

    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
    setCurrentPath(targetPath);
    setCurrentTab(tab);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      setCurrentPath(path);
      if (path === '/login') setCurrentTab('login');
      else if (path === '/register') setCurrentTab('register');
      else if (path.startsWith('/guest/dashboard')) setCurrentTab('guest_dashboard');
      else if (path.startsWith('/admin/dashboard')) setCurrentTab('admin_dashboard');
      else setCurrentTab('home');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handlePropertySelect = (id) => {
    setSelectedPropertyId(id);
    const propertyUnitsForProp = propertyUnits.filter(u => u.propertyId === id && u.status === 'available');
    const entireUnit = propertyUnitsForProp.find(u => u.unitType === 'Entire Property');
    if (entireUnit) {
      setSelectedUnitId(entireUnit.id);
    } else if (propertyUnitsForProp.length > 0) {
      setSelectedUnitId(propertyUnitsForProp[0].id);
    } else {
      setSelectedUnitId(null);
    }
    handleNavigate('property_detail');
  };

  // Convert File uploads to base64 Data URLs
  const handleImageUpload = (e, target) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (target === 'cover') {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPropFormCoverUrl(reader.result);
      };
      reader.readAsDataURL(files[0]);
    } else if (target === 'secondary') {
      const uploadedUrls = [];
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          uploadedUrls.push(reader.result);
          if (uploadedUrls.length === files.length) {
            setPropFormSecondaryUrls(prev => [...uploadedUrls, ...prev.slice(uploadedUrls.length)].slice(0, 4));
          }
        };
        reader.readAsDataURL(file);
      });
    } else if (target === 'unit') {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUnitFormPhotoUrl(reader.result);
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const toggleAmenityFilter = (id) => {
    setSelectedAmenities(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Render Lucide Icon dynamically
  const renderIcon = (name, size = 18, color = 'currentColor') => {
    const Icon = Icons[name] || Icons.Home;
    return <Icon size={size} color={color} />;
  };

  // 1. FILTER PROPERTIES LIST
  const filteredProperties = properties.filter(p => {
    if (p.status === 'archived') return false;

    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.country.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesPrice = p.pricePerNight <= priceFilter;
    const matchesAmenities = selectedAmenities.every(aId => p.amenities.includes(aId));

    return matchesSearch && matchesCategory && matchesPrice && matchesAmenities;
  });

  console.log('[App] Total properties:', properties.length, 'filtered:', filteredProperties.length, 'searchQuery:', searchQuery, 'categoryFilter:', categoryFilter);

  // Calculate Average rating for a property
  const getAverageRating = (pId) => {
    const propReviews = reviews.filter(r => r.propertyId === pId);
    if (propReviews.length === 0) return 5.0;
    const sum = propReviews.reduce((s, r) => s + r.rating, 0);
    return (sum / propReviews.length).toFixed(1);
  };

  // 2. CHECKOUT FLOW ACTIONS
  const handleProceedBooking = () => {
    setBookingError('');
    if (!currentUser) {
      setBookingError('You must sign in as a Guest to complete reservations.');
      return;
    }
    if (!selectedUnitId) {
      setBookingError('Please choose an available option first.');
      return;
    }
    if (!bookingDates.checkIn || !bookingDates.checkOut) {
      setBookingError('Please select both Check-In and Check-Out dates.');
      return;
    }
    const checkIn = new Date(bookingDates.checkIn);
    const checkOut = new Date(bookingDates.checkOut);
    if (checkOut <= checkIn) {
      setBookingError('Check-Out date must be after Check-In date.');
      return;
    }

    try {
      const details = calculateBookingDetails(selectedPropertyId, selectedUnitId, bookingDates.checkIn, bookingDates.checkOut, bookingDates.guests);
      if (!details || details.nights <= 0) {
        setBookingError('Invalid dates selected.');
        return;
      }
      setShowCheckoutModal(true);
    } catch (e) {
      setBookingError(e.message);
    }
  };

  const paymentMethods = [
    { value: 'gcash', label: 'GCash', icon: 'Smartphone' },
    { value: 'maya', label: 'Maya', icon: 'Wallet' },
    { value: 'credit_card', label: 'Credit Card', icon: 'CreditCard' },
    { value: 'debit_card', label: 'Debit Card', icon: 'CreditCard' },
    { value: 'paypal', label: 'PayPal', icon: 'Wallet' },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: 'Banknote' },
    { value: 'apple_pay', label: 'Apple Pay' },
    { value: 'google_pay', label: 'Google Pay' }
  ];

  const handleConfirmPayment = async () => {
    setCheckoutLoading(true);
    try {
      const result = await createBooking(
        selectedPropertyId,
        selectedUnitId,
        bookingDates.checkIn,
        bookingDates.checkOut,
        bookingDates.guests,
        checkoutMethod
      );
      setShowCheckoutModal(false);
      setBookingConfirmedRef(result.booking);
      setBookingDates({ checkIn: '', checkOut: '', guests: 1 });

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        setEmailSentModalInfo({
          bookingId: result.booking.id,
          checkIn: result.booking.checkIn,
          checkOut: result.booking.checkOut,
          price: result.booking.totalPrice,
          propertyTitle: properties.find(pr => pr.id === selectedPropertyId)?.title || 'Stay',
          unitName: propertyUnits.find(u => u.id === selectedUnitId)?.unitName || 'Unit',
          userEmail: currentUser?.email || 'guest@example.com'
        });
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  // 3. SUBMIT REVIEW ACTIONS
  const handlePostReview = (e) => {
    e.preventDefault();
    setReviewError('');
    if (!newReviewComment.trim()) {
      setReviewError('Review comment cannot be empty.');
      return;
    }
    try {
      addReview(selectedPropertyId, newReviewRating, newReviewComment);
      setNewReviewComment('');
      setNewReviewRating(5);
    } catch (err) {
      setReviewError(err.message);
    }
  };

  // 4. PROPERTY FORM MODALS SUBMIT
  const handleOpenPropertyForm = (mode) => {
    setPropFormError('');
    if (mode === 'add') {
      setShowPropertyFormModal('add');
      setPropFormTitle('');
      setPropFormDesc('');
      setPropFormCategory('Beachfront');
      setPropFormPrice('');
      setPropFormBeds('');
      setPropFormBaths('');
      setPropFormGuests('');
      setPropFormCity('');
      setPropFormCountry('');
      setPropFormAddress('');
      setPropFormAmenities([]);
      setPropFormCoverUrl('');
      setPropFormSecondaryUrls(['', '']);
      setPropFormSeasonal([]);
      setPropFormDiscounts([]);
    } else {
      const p = properties.find(x => x.id === mode);
      const pImgs = propertyImages.filter(img => img.propertyId === mode);
      const coverImg = pImgs.find(img => img.isCover)?.url || '';
      const otherImgs = pImgs.filter(img => !img.isCover).map(img => img.url);

      setShowPropertyFormModal(mode);
      setPropFormTitle(p.title);
      setPropFormDesc(p.description);
      setPropFormCategory(p.category);
      setPropFormPrice(p.pricePerNight.toString());
      setPropFormBeds(p.beds.toString());
      setPropFormBaths(p.baths.toString());
      setPropFormGuests(p.guests.toString());
      setPropFormCity(p.location.city);
      setPropFormCountry(p.location.country);
      setPropFormAddress(p.location.address);
      setPropFormAmenities(p.amenities || []);
      setPropFormCoverUrl(coverImg);
      setPropFormSecondaryUrls(otherImgs.concat(['', '']).slice(0, 2));
      setPropFormSeasonal(p.seasonalPricing || []);
      setPropFormDiscounts(p.discounts || []);
    }
  };

  const handleSaveProperty = async (e) => {
    e.preventDefault();
    setPropFormError('');
    if (!propFormTitle || !propFormDesc || !propFormPrice || !propFormCity || !propFormCountry || !propFormAddress) {
      setPropFormError('Please fill out all required fields.');
      return;
    }

    const data = {
      title: propFormTitle,
      description: propFormDesc,
      category: propFormCategory,
      pricePerNight: Number(propFormPrice),
      beds: Number(propFormBeds),
      baths: Number(propFormBaths),
      guests: Number(propFormGuests),
      location: { city: propFormCity, country: propFormCountry, address: propFormAddress },
      amenities: propFormAmenities,
      seasonalPricing: propFormSeasonal,
      discounts: propFormDiscounts
    };

    try {
      if (showPropertyFormModal === 'add') {
        await addProperty(data, propFormCoverUrl, propFormSecondaryUrls);
      } else {
        await updateProperty(showPropertyFormModal, data, propFormCoverUrl, propFormSecondaryUrls);
      }
      setShowPropertyFormModal(null);
    } catch (err) {
      setPropFormError(err.message);
    }
  };

  // Add seasonal rate to property builder
  const handleAddSeasonalRule = () => {
    if (propFormSeasonal.find(r => r.month === Number(newSeasonalMonth))) {
      alert('Seasonal rate already exists for this month.');
      return;
    }
    setPropFormSeasonal(prev => [...prev, { month: Number(newSeasonalMonth), multiplier: Number(newSeasonalMult) }]);
  };

  // Remove seasonal rate
  const handleRemoveSeasonalRule = (month) => {
    setPropFormSeasonal(prev => prev.filter(r => r.month !== month));
  };

  // Add discount rule to property builder
  const handleAddDiscountRule = () => {
    if (propFormDiscounts.find(d => d.minDays === Number(newDiscountDays))) {
      alert('Discount tier already exists for this night duration.');
      return;
    }
    setPropFormDiscounts(prev => [...prev, { minDays: Number(newDiscountDays), percentage: Number(newDiscountPct) }]);
  };

  // Remove discount rule
  const handleRemoveDiscountRule = (days) => {
    setPropFormDiscounts(prev => prev.filter(d => d.minDays !== days));
  };

  // Admin unit forms submit
  const handleOpenUnitForm = (mode, propId = '') => {
    setUnitFormError('');
    if (mode === 'add') {
      setShowUnitFormModal('add');
      setUnitFormPropertyId(propId || properties[0]?.id || '');
      setUnitFormName('');
      setUnitFormType('Room');
      setUnitFormDesc('');
      setUnitFormMaxGuests('2');
      setUnitFormPrice('');
      setUnitFormStatus('available');
      setUnitFormPhotoUrl('');
    } else {
      const u = propertyUnits.find(x => x.id === mode);
      setShowUnitFormModal(mode);
      setUnitFormPropertyId(u.propertyId);
      setUnitFormName(u.unitName);
      setUnitFormType(u.unitType);
      setUnitFormDesc(u.description);
      setUnitFormMaxGuests(u.maxGuests.toString());
      setUnitFormPrice(u.pricePerNight.toString());
      setUnitFormStatus(u.status);
      setUnitFormPhotoUrl(u.photoUrl);
    }
  };

  const handleSaveUnit = async (e) => {
    e.preventDefault();
    setUnitFormError('');
    if (!unitFormName || !unitFormPrice || !unitFormPropertyId) {
      setUnitFormError('Please fill out all required fields.');
      return;
    }

    const data = {
      propertyId: unitFormPropertyId,
      unitName: unitFormName,
      unitType: unitFormType,
      description: unitFormDesc,
      maxGuests: Number(unitFormMaxGuests),
      pricePerNight: Number(unitFormPrice),
      status: unitFormStatus,
      photoUrl: unitFormPhotoUrl
    };

    try {
      if (showUnitFormModal === 'add') {
        await addPropertyUnit(data);
      } else {
        await updatePropertyUnit(showUnitFormModal, data);
      }
      setShowUnitFormModal(null);
    } catch (err) {
      setUnitFormError(err.message);
    }
  };

  // Admin save branding customizer
  const handleSaveSettings = (e) => {
    e.preventDefault();
    updateSettings({
      logoText: settingsLogoText,
      bannerTitle: settingsBannerTitle,
      bannerSubtitle: settingsBannerSubtitle,
      bannerImage: settingsBannerImage,
      contactEmail: settingsEmail,
      contactPhone: settingsPhone
    });
    alert('Branding and Customization saved successfully!');
  };

  const handleAdminPasswordSubmit = (e) => {
    e.preventDefault();
    setAdminPassMessage('');
    try {
      changeAdminPassword(oldAdminPass, newAdminPass);
      setAdminPassMessage('Password updated successfully.');
      setOldAdminPass('');
      setNewAdminPass('');
    } catch (err) {
      setAdminPassMessage('❌ ' + err.message);
    }
  };

  // FAQ management inside settings tab
  const handleAddFaq = () => {
    const q = prompt("Enter FAQ Question:");
    const a = prompt("Enter FAQ Answer:");
    if (!q || !a) return;
    const updated = [...settingsFaqs, { id: 'faq_' + Math.random().toString(36).substr(2, 5), question: q, answer: a }];
    setSettingsFaqs(updated);
    updateSettings({ faqs: updated });
  };

  const handleRemoveFaq = (id) => {
    const updated = settingsFaqs.filter(f => f.id !== id);
    setSettingsFaqs(updated);
    updateSettings({ faqs: updated });
  };

  // Export report helper
  const handleExportCSV = (reportType) => {
    let headers = '';
    let rows = [];
    
    if (reportType === 'revenue') {
      headers = 'Payment ID,Booking ID,Amount,Method,Status,Ref,Date\n';
      rows = payments.map(p => `"${p.id}","${p.bookingId}",₱${p.amount},"${p.method}","${p.status}","${p.transactionRef}","${p.createdAt}"`);
    } else if (reportType === 'bookings') {
      headers = 'Booking ID,Property,User,Check-In,Check-Out,Total,Status,Guests\n';
      rows = bookings.map(b => {
        const propTitle = properties.find(p => p.id === b.propertyId)?.title || 'Unknown';
        return `"${b.id}","${propTitle}","${b.userId}","${b.checkIn}","${b.checkOut}",₱${b.totalPrice},"${b.status}","${b.guestsCount}"`;
      });
    } else if (reportType === 'occupancy') {
      headers = 'Property ID,Title,Category,Price,Beds,Status\n';
      rows = properties.map(p => `"${p.id}","${p.title}","${p.category}",₱${p.pricePerNight},"${p.beds}","${p.status}"`);
    }

    const csvContent = "data:text/csv;charset=utf-8," + headers + rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reportType}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // View Switcher logic
  const renderSidebar = () => {
    const tabs = [
      { id: 'admin_dashboard', label: 'Overview Metrics', icon: 'LayoutDashboard' },
      { id: 'admin_properties', label: 'Properties Manager', icon: 'Home' },
      { id: 'admin_units', label: 'Unit Management', icon: 'Box' },
      { id: 'admin_bookings', label: 'Reservations Timeline', icon: 'Calendar' },
      { id: 'admin_payments', label: 'Payment Management', icon: 'CreditCard' },
      { id: 'admin_settings', label: 'Website Customizer', icon: 'Settings' },
      { id: 'admin_logs', label: 'Security & Logs', icon: 'Lock' }
    ];

    return (
      <aside className="glass no-print" style={{
        width: '260px',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        height: 'calc(100vh - var(--header-height))',
        position: 'sticky',
        top: 'var(--header-height)',
        borderRight: '1px solid var(--border-color)'
      }}>
        <div style={{ padding: '0 8px 16px 8px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
          <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Admin Dashboard</h4>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-success)', fontWeight: 600 }}>Role-Based Access: On</span>
        </div>

        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => handleNavigate(t.id)}
            className="btn"
            style={{
              justifyContent: 'flex-start',
              padding: '12px 16px',
              fontSize: '0.88rem',
              backgroundColor: currentTab === t.id ? 'var(--color-primary-light)' : 'transparent',
              color: currentTab === t.id ? 'var(--color-primary)' : 'var(--text-secondary)'
            }}
          >
            {renderIcon(t.icon, 18)}
            {t.label}
          </button>
        ))}
      </aside>
    );
  };

  // Occupancy rate calculator
  const getOccupancyRate = () => {
    const activeBookings = bookings.filter(b => b.status !== 'cancelled' && b.status !== 'rejected');
    if (activeBookings.length === 0 || propertyUnits.length === 0) return '0.0%';
    const bookedUnitIds = new Set(activeBookings.map(b => b.unitId));
    const rate = (bookedUnitIds.size / propertyUnits.length) * 100;
    return `${rate.toFixed(1)}%`;
  };

  // Get matching reports bookings
  const getReportBookings = () => {
    return bookings.filter(b => {
      const propMatches = reportPropId === 'All' || b.propertyId === reportPropId;
      const unitMatches = reportUnitId === 'All' || b.unitId === reportUnitId;
      
      let dateMatches = true;
      if (reportStartDate) {
        dateMatches = dateMatches && (b.checkIn >= reportStartDate);
      }
      if (reportEndDate) {
        dateMatches = dateMatches && (b.checkOut <= reportEndDate);
      }

      return propMatches && unitMatches && dateMatches;
    });
  };

  return (
    <div className="flex flex-col" style={{ minHeight: '100vh' }}>
      <Navbar
        onSearchChange={setSearchQuery}
        searchQuery={searchQuery}
        onNavigate={handleNavigate}
        currentTab={currentTab}
        currentPath={currentPath}
      />

      <div className="flex" style={{ flexGrow: 1 }}>
        {/* Render Admin sidebar if active role is admin and in admin view */}
        {activeRole === 'admin' && currentTab.startsWith('admin') && renderSidebar()}

        <main style={{ flexGrow: 1, padding: currentTab === 'home' ? '0' : '32px 0', overflow: 'hidden' }}>
          <div className="container">
            {/* PUBLIC LANDING PAGE (DEFAULT ROUTE /) */}
            {currentTab === 'home' && (
              <LandingPage
                onPropertySelect={handlePropertySelect}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onNavigate={handleNavigate}
              />
            )}

            {/* DEDICATED LOGIN PAGE (/login) */}
            {currentTab === 'login' && (
              <LoginPage onNavigate={handleNavigate} />
            )}

            {/* DEDICATED REGISTER PAGE (/register) */}
            {currentTab === 'register' && (
              <RegisterPage onNavigate={handleNavigate} />
            )}

            {/* GUEST PORTAL: PROPERTY DETAIL PAGE */}
            {currentTab === 'property_detail' && (
              (() => {
                const p = properties.find(x => x.id === selectedPropertyId);
                if (!p) return <div>Property not found.</div>;

                const pImgs = propertyImages.filter(img => img.propertyId === selectedPropertyId);
                const coverImg = pImgs.find(img => img.isCover)?.url || '/beach_villa.png';
                const secondImgs = pImgs.filter(img => !img.isCover);
                const propReviews = reviews.filter(r => r.propertyId === selectedPropertyId);
                const avgRating = getAverageRating(p.id);

                const activeUnitsForProp = propertyUnits.filter(u => u.propertyId === p.id && u.status === 'available');

                // Live calculate values for widget
                let costDetails = null;
                if (bookingDates.checkIn && bookingDates.checkOut && selectedUnitId) {
                  costDetails = calculateBookingDetails(p.id, selectedUnitId, bookingDates.checkIn, bookingDates.checkOut, bookingDates.guests);
                }

                const currentSelectedUnit = propertyUnits.find(u => u.id === selectedUnitId);

                return (
                  <div className="flex flex-col gap-3">
                    {/* Back header */}
                    <div className="flex align-center justify-between no-print">
                      <button className="btn btn-secondary" onClick={() => handleNavigate('home')}>
                        <Icons.ArrowLeft size={16} /> Back to Browse
                      </button>
                      <div className="flex align-center gap-2">
                        <span className="badge badge-success">Verified Listing</span>
                        <span>{p.category}</span>
                      </div>
                    </div>

                    {/* Listing Title */}
                    <div>
                      <h1 style={{ fontSize: '2rem' }}>{p.title}</h1>
                      <div className="flex align-center gap-3" style={{ fontSize: '0.92rem', marginTop: '8px', color: 'var(--text-secondary)' }}>
                        <span className="flex align-center gap-1">
                          <Icons.Star size={16} fill="var(--color-warning)" stroke="var(--color-warning)" />
                          <strong style={{ color: 'var(--text-primary)' }}>{avgRating}</strong> ({propReviews.length} reviews)
                        </span>
                        <span>•</span>
                        <span className="flex align-center gap-1">
                          <Icons.MapPin size={16} /> {p.location.address}, {p.location.city}, {p.location.country}
                        </span>
                      </div>
                    </div>

                    {/* Image Collage Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr',
                      gap: '12px',
                      height: '420px',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden'
                    }}>
                      <img src={coverImg} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
                        {secondImgs.slice(0, 2).map((img, idx) => (
                          <img key={img.id} src={img.url} alt={`Gallery ${idx}`} style={{ width: '100%', height: 'calc(50% - 6px)', objectFit: 'cover' }} />
                        ))}
                        {secondImgs.length < 2 && (
                          <div style={{ width: '100%', height: '50%', backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                            <Icons.Image size={32} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Description vs Booking Widget Grid */}
                    <div className="grid grid-cols-3 gap-3" style={{ gridTemplateColumns: '2fr 1fr', alignItems: 'start', marginTop: '24px' }}>
                      {/* Left: Info */}
                      <div className="flex flex-col gap-3">
                        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '24px' }}>
                          <h3>Entire property hosted by Sarah Jenkins</h3>
                          <p style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>
                            {p.guests} guests • {p.beds} bedrooms • {p.baths} bathrooms
                          </p>
                        </div>

                        {/* Booking Option Selector */}
                        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '24px' }}>
                          <h4 style={{ marginBottom: '16px' }}>Available Booking Options</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {activeUnitsForProp.map(unit => (
                              <div
                                key={unit.id}
                                onClick={() => setSelectedUnitId(unit.id)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '16px',
                                  borderRadius: 'var(--radius-md)',
                                  border: selectedUnitId === unit.id ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                                  backgroundColor: selectedUnitId === unit.id ? 'var(--color-primary-light)' : 'transparent',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                  {unit.photoUrl ? (
                                    <img src={unit.photoUrl} alt={unit.unitName} style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                                  ) : (
                                    <div style={{ width: '80px', height: '60px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <Icons.Image size={24} />
                                    </div>
                                  )}
                                  <div>
                                    <h5 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)' }}>{unit.unitName}</h5>
                                    <span className="badge badge-info" style={{ fontSize: '0.7rem', marginTop: '4px', display: 'inline-block' }}>{unit.unitType}</span>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{unit.description} • Max guests: {unit.maxGuests}</p>
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>₱{unit.pricePerNight.toLocaleString()}</span>
                                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}> / night</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Text Description */}
                        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '24px' }}>
                          <h4 style={{ marginBottom: '12px' }}>About this space</h4>
                          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.98rem' }}>{p.description}</p>
                        </div>

                        {/* Amenities */}
                        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '24px' }}>
                          <h4 style={{ marginBottom: '16px' }}>What this place offers</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {p.amenities.map(aId => {
                              const item = amenities.find(a => a.id === aId);
                              return item ? (
                                <div key={aId} className="flex align-center gap-2" style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                                  {renderIcon(item.icon, 18, 'var(--text-secondary)')}
                                  <span>{item.name}</span>
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Right: Booking widget Card */}
                      <div className="glass" style={{
                        padding: '24px',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-md)',
                        position: 'sticky',
                        top: '100px'
                      }}>
                        <div className="flex justify-between align-center" style={{ marginBottom: '20px' }}>
                          <div>
                            <span style={{ fontSize: '1.4rem', fontWeight: 700 }}>₱{(currentSelectedUnit ? currentSelectedUnit.pricePerNight : p.pricePerNight).toLocaleString()}</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}> / night</span>
                          </div>
                          <div className="flex align-center gap-1" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                            <Icons.Star size={14} fill="var(--color-warning)" stroke="var(--color-warning)" />
                            <span>{avgRating}</span>
                          </div>
                        </div>

                        {bookingError && (
                          <div style={{ color: 'var(--color-danger)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '12px' }}>
                            {bookingError}
                          </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                          <div className="grid grid-cols-2 gap-2" style={{ gap: '0px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                            <div style={{ padding: '8px 12px', borderRight: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                              <label style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Check-In</label>
                              <input
                                type="date"
                                value={bookingDates.checkIn}
                                onChange={e => setBookingDates(prev => ({ ...prev, checkIn: e.target.value }))}
                                style={{ background: 'none', border: 'none', width: '100%', fontSize: '0.82rem', color: 'var(--text-primary)', marginTop: '4px' }}
                              />
                            </div>
                            <div style={{ padding: '8px 12px', background: 'var(--bg-secondary)' }}>
                              <label style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Check-Out</label>
                              <input
                                type="date"
                                value={bookingDates.checkOut}
                                onChange={e => setBookingDates(prev => ({ ...prev, checkOut: e.target.value }))}
                                style={{ background: 'none', border: 'none', width: '100%', fontSize: '0.82rem', color: 'var(--text-primary)', marginTop: '4px' }}
                              />
                            </div>
                          </div>

                          <div style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)' }}>
                            <label style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Guests Capacity</label>
                            <select
                              value={bookingDates.guests}
                              onChange={e => setBookingDates(prev => ({ ...prev, guests: Number(e.target.value) }))}
                              style={{ background: 'none', border: 'none', width: '100%', fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '4px' }}
                            >
                              {Array.from({ length: currentSelectedUnit ? currentSelectedUnit.maxGuests : p.guests }, (_, i) => (
                                <option key={i + 1} value={i + 1}>{i + 1} {i + 1 === 1 ? 'guest' : 'guests'}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Price breakdown details */}
                        {costDetails && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                            <div className="flex justify-between">
                              <span>₱{(currentSelectedUnit ? currentSelectedUnit.pricePerNight : p.pricePerNight).toLocaleString()} x {costDetails.nights} nights</span>
                              <span>₱{costDetails.subtotal.toLocaleString()}</span>
                            </div>
                            {costDetails.discountAmount > 0 && (
                              <div className="flex justify-between" style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                                <span>{costDetails.discountPercent}% Duration Discount</span>
                                <span>-₱{costDetails.discountAmount.toLocaleString()}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span>Tourism Taxes (8%)</span>
                              <span>₱{costDetails.tax.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Platform Service Fee</span>
                              <span>₱{costDetails.serviceFee.toLocaleString()}</span>
                            </div>
                            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />
                            <div className="flex justify-between" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              <span>Total Quote</span>
                              <span>₱{costDetails.totalPrice.toLocaleString()}</span>
                            </div>
                          </div>
                        )}

                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleProceedBooking}>
                          Pay & Confirm Instantly
                        </button>
                        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '12px' }}>
                          Double booking checking: active. Instant confirmation.
                        </p>
                      </div>
                    </div>

                    {/* Reviews list */}
                    <div style={{ marginTop: '48px', borderTop: '1px solid var(--border-color)', paddingTop: '32px' }}>
                      <h3 style={{ marginBottom: '24px' }}>Guest Reviews ({propReviews.length})</h3>
                      
                      <div className="grid grid-cols-2 gap-3" style={{ marginBottom: '32px' }}>
                        {propReviews.map(r => {
                          return (
                            <div key={r.id} className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
                              <div className="flex justify-between align-center" style={{ marginBottom: '12px' }}>
                                <div className="flex align-center gap-2">
                                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                                    {r.userId === 'u1' ? 'JD' : (r.userId === 'u2' ? 'JO' : 'GU')}
                                  </div>
                                  <div>
                                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.userId === 'u1' ? 'Jane Doe' : (r.userId === 'u2' ? 'John Doe' : 'Guest User')}</span>
                                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                                  </div>
                                </div>
                                <div className="flex align-center gap-1" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                  <Icons.Star size={14} fill="var(--color-warning)" stroke="var(--color-warning)" />
                                  <span>{r.rating}</span>
                                </div>
                              </div>
                              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{r.comment}"</p>
                              
                              {/* Host response */}
                              {r.response && (
                                <div style={{
                                  backgroundColor: 'var(--bg-secondary)',
                                  borderLeft: '2px solid var(--color-primary)',
                                  padding: '10px 14px',
                                  borderRadius: 'var(--radius-sm)',
                                  marginTop: '12px',
                                  fontSize: '0.82rem'
                                }}>
                                  <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '2px' }}>Host Response:</strong>
                                  <p style={{ color: 'var(--text-secondary)' }}>{r.response}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Add Review Panel */}
                      {currentUser ? (
                        <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-md)', maxWidth: '600px' }}>
                          <h4 style={{ marginBottom: '16px' }}>Leave a Review</h4>
                          
                          {reviewError && (
                            <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: '12px', fontWeight: 600 }}>{reviewError}</div>
                          )}

                          <form onSubmit={handlePostReview} className="flex flex-col gap-2">
                            <div className="input-group">
                              <label>Rating</label>
                              <select
                                className="input-field"
                                value={newReviewRating}
                                onChange={e => setNewReviewRating(Number(e.target.value))}
                                style={{ maxWidth: '100px' }}
                              >
                                {[5, 4, 3, 2, 1].map(v => <option key={v} value={v}>{v} Stars</option>)}
                              </select>
                            </div>
                            <div className="input-group">
                              <label>Comment</label>
                              <textarea
                                rows="3"
                                className="input-field"
                                placeholder="Describe your stay, amenities quality, checking, environment details..."
                                value={newReviewComment}
                                onChange={e => setNewReviewComment(e.target.value)}
                                required
                              />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: 'fit-content' }}>
                              Submit Review
                            </button>
                          </form>
                        </div>
                      ) : (
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                          💡 Please sign in to submit your review of this listing.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()
            )}

            {/* GUEST PORTAL: GUEST RESERVATION DASHBOARD */}
            {currentTab === 'guest_dashboard' && activeRole === 'guest' && currentUser && (
              <div className="flex flex-col gap-3">
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                  <h2>Guest Profile Dashboard</h2>
                  <p style={{ color: 'var(--text-secondary)' }}>Manage your stay schedules, verify receipts, and check transaction logs.</p>
                </div>

                {/* Profile card summary */}
                <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-md)', display: 'flex', gap: '24px', alignItems: 'center' }}>
                  <img src={currentUser.avatar} alt="avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <h3 style={{ margin: 0 }}>{currentUser.name}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{currentUser.email} • {currentUser.phone}</p>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <span className="badge badge-success">Email Verified</span>
                      <span className="badge badge-info">ID Authenticated</span>
                    </div>
                  </div>
                </div>

                {/* Bookings table */}
                <div style={{ marginTop: '24px' }}>
                  <h3 style={{ marginBottom: '16px' }}>My Stays History</h3>
                  
                  {bookings.filter(b => b.userId === currentUser.id).length === 0 ? (
                    <div className="glass" style={{ padding: '32px', textAlign: 'center', borderRadius: 'var(--radius-md)' }}>
                      <Icons.Calendar size={32} style={{ color: 'var(--text-tertiary)', marginBottom: '12px' }} />
                      <p style={{ color: 'var(--text-secondary)' }}>You haven't reserved any property yet.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {bookings.filter(b => b.userId === currentUser.id).map(b => {
                        const prop = properties.find(p => p.id === b.propertyId);
                        const unit = propertyUnits.find(u => u.id === b.unitId);
                        const pay = payments.find(py => py.bookingId === b.id);
                        
                        return (
                          <div key={b.id} className="glass" style={{
                            padding: '20px',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div className="flex flex-col gap-1">
                              <h4 style={{ margin: 0 }}>{prop?.title || 'Luxury Retreat'} - <span style={{ color: 'var(--color-primary)' }}>{unit?.unitName || 'Entire Stay'}</span></h4>
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                Dates: <strong>{b.checkIn}</strong> to <strong>{b.checkOut}</strong> • {b.guestsCount} guests
                              </p>
<div className="flex gap-2 align-center" style={{ marginTop: '8px' }}>
                                 <span className={`badge ${
                                   b.paymentStatus === 'paid' || b.status === 'confirmed' ? 'badge-success' : 
                                   b.paymentStatus === 'pending' || b.status === 'pending_payment' ? 'badge-warning' :
                                   'badge-secondary'
                                 }`}>
                                   Booking: {b.bookingStatus === 'confirmed' ? 'Confirmed' : b.bookingStatus || 'Pending'}
                                 </span>
                                 {pay && (
                                   <span className={`badge ${
                                     (pay.paymentStatus || pay.status) === 'paid' ? 'badge-success' : 
                                     (pay.paymentStatus || pay.status) === 'pending' ? 'badge-warning' :
                                     'badge-secondary'
                                   }`}>
                                     Payment: {(pay.paymentStatus || pay.status) || 'pending'}
                                   </span>
                                 )}
                               </div>
                            </div>

                            <div className="flex gap-2">
                              <button className="btn btn-secondary" onClick={() => setSelectedReceiptBooking(b)}>
                                <Icons.FileText size={16} /> Receipt
                              </button>
                              
{b.bookingStatus === 'pending_payment' || b.status === 'pending_payment' ? (
                                 <button className="btn btn-danger" onClick={() => cancelBooking(b.id, 'user')}>
                                   Cancel Stay
                                 </button>
                               ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ADMINISTRATOR PANELS */}
            {activeRole === 'admin' && currentAdmin && (
              <>
                {/* ADMIN OVERVIEW DASHBOARD */}
                {currentTab === 'admin_dashboard' && (
                  <div className="flex flex-col gap-4">
                    <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                      <h2>System Overview Dashboard</h2>
                      <p style={{ color: 'var(--text-secondary)' }}>Overview occupancy metrics, financial ledgers, and property catalogs.</p>
                    </div>

                    {/* Supabase Connection Status Badge */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: supabaseEnabled ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
                      border: `1px solid ${supabaseEnabled ? 'var(--color-success)' : 'var(--color-warning)'}`,
                      fontSize: '0.85rem', fontWeight: 600
                    }}>
                      {supabaseEnabled
                        ? <><Icons.Database size={16} color="var(--color-success)" /> <span style={{ color: 'var(--color-success)' }}>✅ Connected to Supabase cloud database — all data is persisted in real-time.</span></>
                        : <><Icons.WifiOff size={16} color="var(--color-warning)" /> <span style={{ color: 'var(--color-warning)' }}>⚠️ Offline mode — running on localStorage. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env to enable cloud sync.</span></>
                      }
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-4 gap-3">
                      <div className="glass card-stat" style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
                        <div className="flex justify-between align-center">
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>TOTAL PROPERTIES</span>
                          <Icons.Home size={20} style={{ color: 'var(--color-primary)' }} />
                        </div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '8px 0 0 0' }}>{properties.filter(p => p.status !== 'archived').length}</h2>
                      </div>
                      
                      <div className="glass card-stat" style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
                        <div className="flex justify-between align-center">
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>TOTAL UNITS</span>
                          <Icons.Box size={20} style={{ color: 'var(--color-info)' }} />
                        </div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '8px 0 0 0' }}>{propertyUnits.filter(u => u.status !== 'archived').length}</h2>
                      </div>

                      <div className="glass card-stat" style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
                        <div className="flex justify-between align-center">
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>OCCUPANCY RATE</span>
                          <Icons.Percent size={20} style={{ color: 'var(--color-warning)' }} />
                        </div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '8px 0 0 0' }}>{getOccupancyRate()}</h2>
                      </div>

                      <div className="glass card-stat" style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
                        <div className="flex justify-between align-center">
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>REVENUE (PESO)</span>
                          <Icons.DollarSign size={20} style={{ color: 'var(--color-success)' }} />
                        </div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '8px 0 0 0' }}>₱{payments.filter(p => p.status === 'verified').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</h2>
                      </div>
                    </div>

                    <AnalyticsCharts />

                    {/* PDF/CSV download report trigger row */}
                    <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-md)', marginTop: '16px' }}>
                      <h4 style={{ marginBottom: '16px' }}>Generate Financial & Operations Report</h4>
                      <div className="flex gap-2">
                        <button className="btn btn-secondary" onClick={() => handleExportCSV('revenue')}>
                          <Icons.Download size={16} /> Export Revenue CSV
                        </button>
                        <button className="btn btn-secondary" onClick={() => handleExportCSV('bookings')}>
                          <Icons.Download size={16} /> Export Reservations CSV
                        </button>
                        <button className="btn btn-secondary" onClick={() => handleExportCSV('occupancy')}>
                          <Icons.Download size={16} /> Export Inventory CSV
                        </button>
                        <button className="btn className=primary" style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', padding: '10px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => handleNavigate('admin_reports')}>
                          <Icons.FileText size={16} /> Open Reports Section
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ADMIN PROPERTIES LIST MANAGER */}
                {currentTab === 'admin_properties' && (
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between align-center" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                      <div>
                        <h2>Manage Properties</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>Configure prices, seasonal rates, multi-image lists, and status parameters.</p>
                      </div>
                      <button className="btn btn-primary" onClick={() => handleOpenPropertyForm('add')}>
                        <Icons.Plus size={18} /> Add Property Listing
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3" style={{ marginTop: '16px' }}>
                      {properties.filter(p => p.status !== 'archived').map(p => {
                        const coverImg = propertyImages.find(img => img.propertyId === p.id && img.isCover)?.url || '/beach_villa.png';
                        return (
                          <div key={p.id} className="glass flex flex-col" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                            <img src={coverImg} alt={p.title} style={{ height: '180px', objectFit: 'cover' }} />
                            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
                              <div>
                                <h4 style={{ margin: 0 }}>{p.title}</h4>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{p.location.city}, {p.location.country}</span>
                              </div>
                              
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <span>Base Price: <strong>₱{p.pricePerNight.toLocaleString()}</strong></span>
                                <span className={`badge ${p.status === 'available' ? 'badge-success' : 'badge-danger'}`}>
                                  {p.status}
                                </span>
                              </div>

                              <div className="flex gap-2" style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                                <button className="btn btn-secondary" style={{ flexGrow: 1, padding: '8px' }} onClick={() => handleOpenPropertyForm(p.id)}>
                                  <Icons.Edit size={14} /> Edit details
                                </button>
                                <button className="btn btn-secondary" style={{ padding: '8px', border: '1px solid var(--color-primary)', color: 'var(--color-primary)' }} onClick={() => { setSelectedAdminPropertyId(p.id); handleNavigate('admin_units'); }} title="Manage Units">
                                  <Icons.Box size={14} /> Units
                                </button>
                                <button className="btn btn-danger" style={{ padding: '8px 12px' }} onClick={() => deleteProperty(p.id)} title="Archive Property">
                                  <Icons.Trash size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ADMIN PROPERTY UNIT MANAGEMENT */}
                {currentTab === 'admin_units' && (
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between align-center" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                      <div>
                        <h2>Property Unit Management</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>Define and adjust rentable options (Entire Property or Rooms) with pricing, capacities, and status toggles.</p>
                      </div>
                      <button className="btn btn-primary" onClick={() => handleOpenUnitForm('add', selectedAdminPropertyId)}>
                        <Icons.Plus size={18} /> Add Unit Option
                      </button>
                    </div>

                    {/* Selection Header */}
                    <div className="glass" style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', display: 'flex', gap: '16px', alignItems: 'center', margin: '16px 0' }}>
                      <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>Filter by Property:</label>
                      <select
                        className="input-field"
                        style={{ maxWidth: '300px', margin: 0 }}
                        value={selectedAdminPropertyId}
                        onChange={e => setSelectedAdminPropertyId(e.target.value)}
                      >
                        <option value="">-- All Properties --</option>
                        {properties.filter(p => p.status !== 'archived').map(p => (
                          <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                      </select>
                    </div>

                    {/* Units Table */}
                    <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 700 }}>
                            <th style={{ padding: '12px 8px' }}>Thumbnail</th>
                            <th style={{ padding: '12px 8px' }}>Unit Name</th>
                            <th style={{ padding: '12px 8px' }}>Property</th>
                            <th style={{ padding: '12px 8px' }}>Unit Type</th>
                            <th style={{ padding: '12px 8px' }}>Max Guests</th>
                            <th style={{ padding: '12px 8px' }}>Price / Night</th>
                            <th style={{ padding: '12px 8px' }}>Status</th>
                            <th style={{ padding: '12px 8px', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {propertyUnits
                            .filter(u => !selectedAdminPropertyId || u.propertyId === selectedAdminPropertyId)
                            .map(u => {
                              const parentProperty = properties.find(p => p.id === u.propertyId);
                              return (
                                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                  <td style={{ padding: '10px 8px' }}>
                                    {u.photoUrl ? (
                                      <img src={u.photoUrl} alt="unit" style={{ width: '60px', height: '45px', objectFit: 'cover', borderRadius: '4px' }} />
                                    ) : (
                                      <div style={{ width: '60px', height: '45px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Icons.Image size={18} />
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ padding: '10px 8px', fontWeight: 600 }}>{u.unitName}</td>
                                  <td style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>{parentProperty?.title || 'Unknown'}</td>
                                  <td style={{ padding: '10px 8px' }}>
                                    <span className="badge badge-info">{u.unitType}</span>
                                  </td>
                                  <td style={{ padding: '10px 8px' }}>{u.maxGuests} guests</td>
                                  <td style={{ padding: '10px 8px', fontWeight: 700, color: 'var(--color-primary)' }}>₱{u.pricePerNight.toLocaleString()}</td>
                                  <td style={{ padding: '10px 8px' }}>
                                    <span className={`badge ${u.status === 'available' ? 'badge-success' : 'badge-danger'}`}>
                                      {u.status}
                                    </span>
                                  </td>
                                  <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                                    <div className="flex gap-1 justify-end">
                                      <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem' }} onClick={() => handleOpenUnitForm(u.id)}>
                                        Edit
                                      </button>
                                      <button className="btn btn-danger" style={{ padding: '6px 10px', fontSize: '0.8rem' }} onClick={() => deletePropertyUnit(u.id)}>
                                        Delete
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          {propertyUnits.filter(u => !selectedAdminPropertyId || u.propertyId === selectedAdminPropertyId).length === 0 && (
                            <tr>
                              <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                                No unit options defined for the selection. Click "Add Unit Option" to create one.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ADMIN BOOKINGS & CALENDAR SCHEDULER */}
                {currentTab === 'admin_bookings' && (
                  <div className="flex flex-col gap-4">
                    <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                      <h2>Booking Schedulers & Timeline</h2>
                      <p style={{ color: 'var(--text-secondary)' }}>Audit reservation schedules, check conflicts, approve check-ins/check-outs, and verify incoming bank transactions.</p>
                    </div>

                    <CalendarView onSelectBooking={(b) => setSelectedReceiptBooking(b)} />

                    {/* Booking queue */}
                    <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-md)' }}>
                      <h3 style={{ marginBottom: '16px' }}>Incoming Reservations Queue</h3>
                      
                      {bookings.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)' }}>No bookings queued.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {bookings.map(b => {
                            const p = properties.find(x => x.id === b.propertyId);
                            const u = propertyUnits.find(x => x.id === b.unitId);
                            const pay = payments.find(py => py.bookingId === b.id);
                            
                            return (
                              <div key={b.id} className="flex justify-between align-center" style={{
                                padding: '12px 16px',
                                borderBottom: '1px solid var(--border-color)',
                                fontSize: '0.9rem'
                              }}>
                                <div>
                                  <strong>{b.id}</strong> - {p?.title} (<span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{u?.unitName || 'Entire Stay'}</span>) ({b.checkIn} to {b.checkOut})
                                  <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                    Total: <strong>₱{b.totalPrice.toLocaleString()}</strong> | Method: <strong>{pay?.method}</strong> | Payment status: <strong>{pay?.status}</strong>
                                  </span>
                                </div>
                                
                                <div className="flex gap-1">
                                  {b.status === 'pending' && (
                                    <>
                                      <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.8rem', backgroundColor: 'var(--color-success)' }} onClick={() => updateBookingStatus(b.id, 'approved')}>
                                        Approve
                                      </button>
                                      <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => updateBookingStatus(b.id, 'rejected')}>
                                        Reject
                                      </button>
                                    </>
                                  )}
                                  {b.status === 'approved' && (
                                    <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => updateBookingStatus(b.id, 'completed')}>
                                      Complete stay
                                    </button>
                                  )}
                                  {b.status !== 'cancelled' && b.status !== 'rejected' && (
                                    <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => cancelBooking(b.id, 'admin')}>
                                      Cancel
                                    </button>
                                  )}
                                  <span className={`badge badge-success`} style={{ marginLeft: '12px' }}>
                                    Confirmed
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ADMIN REPORTS MANAGEMENT */}
                {currentTab === 'admin_reports' && (
                  <div className="flex flex-col gap-4">
                    <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                      <h2>Operations & Financial Reports</h2>
                      <p style={{ color: 'var(--text-secondary)' }}>Filter occupancy records, unit performance charts, and retrieve custom date range revenue catalogs.</p>
                    </div>

                    {/* Filter Widget */}
                    <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-md)' }}>
                      <h4 style={{ marginBottom: '16px' }}>Filter Report Data</h4>
                      <div className="grid grid-cols-4 gap-2" style={{ gap: '12px' }}>
                        <div className="input-group">
                          <label>Select Property</label>
                          <select className="input-field" value={reportPropId} onChange={e => { setReportPropId(e.target.value); setReportUnitId('All'); }}>
                            <option value="All">All Properties</option>
                            {properties.filter(p => p.status !== 'archived').map(p => (
                              <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                          </select>
                        </div>
                        <div className="input-group">
                          <label>Select Unit Option</label>
                          <select className="input-field" value={reportUnitId} onChange={e => setReportUnitId(e.target.value)}>
                            <option value="All">All Units</option>
                            {propertyUnits
                              .filter(u => reportPropId === 'All' || u.propertyId === reportPropId)
                              .map(u => (
                                <option key={u.id} value={u.id}>{u.unitName}</option>
                              ))}
                          </select>
                        </div>
                        <div className="input-group">
                          <label>Start Date</label>
                          <input type="date" className="input-field" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} />
                        </div>
                        <div className="input-group">
                          <label>End Date</label>
                          <input type="date" className="input-field" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} />
                        </div>
                      </div>
                    </div>

                    {/* Generated Table View */}
                    <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-md)' }}>
                      <div className="flex justify-between align-center" style={{ marginBottom: '16px' }}>
                        <h4 style={{ margin: 0 }}>Report Summary Result</h4>
                        <div className="flex gap-2">
                          <button className="btn btn-secondary" onClick={() => handleExportCSV('revenue')}>
                            <Icons.Download size={14} /> Export CSV
                          </button>
                          <button className="btn btn-primary" onClick={() => window.print()}>
                            <Icons.Printer size={14} /> Print PDF
                          </button>
                        </div>
                      </div>

                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                            <th style={{ padding: '10px' }}>Reference</th>
                            <th style={{ padding: '10px' }}>Property Name</th>
                            <th style={{ padding: '10px' }}>Unit Name</th>
                            <th style={{ padding: '10px' }}>Dates</th>
                            <th style={{ padding: '10px' }}>Guests</th>
                            <th style={{ padding: '10px' }}>Total Price</th>
                            <th style={{ padding: '10px' }}>Booking Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getReportBookings().map(b => {
                            const p = properties.find(pr => pr.id === b.propertyId);
                            const u = propertyUnits.find(un => un.id === b.unitId);
                            return (
                              <tr key={b.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '10px', fontFamily: 'monospace' }}>{b.id}</td>
                                <td style={{ padding: '10px' }}>{p?.title || 'Unknown'}</td>
                                <td style={{ padding: '10px', fontWeight: 600 }}>{u?.unitName || 'Entire Stay'}</td>
                                <td style={{ padding: '10px' }}>{b.checkIn} to {b.checkOut}</td>
                                <td style={{ padding: '10px' }}>{b.guestsCount} guests</td>
                                <td style={{ padding: '10px', fontWeight: 700, color: 'var(--color-primary)' }}>₱{b.totalPrice.toLocaleString()}</td>
                                <td style={{ padding: '10px' }}>
                                  <span className="badge badge-success">confirmed</span>
                                </td>
                              </tr>
                            );
                          })}
                          {getReportBookings().length === 0 && (
                            <tr>
                              <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)' }}>
                                No records found matching the report constraints.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ADMIN WEBSITE CUSTOMIZATION AND SETTINGS */}
                {currentTab === 'admin_settings' && (
                  <div className="flex flex-col gap-4">
                    <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                      <h2>Website Customization</h2>
                      <p style={{ color: 'var(--text-secondary)' }}>Branding rules, slogans, homepage hero banners, FAQ configurations, and security credentials.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Branding panel */}
                      <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-md)' }}>
                        <h4 style={{ marginBottom: '16px' }}>Branding & Content Editor</h4>
                        <form onSubmit={handleSaveSettings} className="flex flex-col gap-2">
                          <div className="input-group">
                            <label>Logo Slogan/Text</label>
                            <input type="text" className="input-field" value={settingsLogoText} onChange={e => setSettingsLogoText(e.target.value)} />
                          </div>
                          <div className="input-group">
                            <label>Homepage Banner Title</label>
                            <input type="text" className="input-field" value={settingsBannerTitle} onChange={e => setSettingsBannerTitle(e.target.value)} />
                          </div>
                          <div className="input-group">
                            <label>Homepage Banner Subtitle</label>
                            <input type="text" className="input-field" value={settingsBannerSubtitle} onChange={e => setSettingsBannerSubtitle(e.target.value)} />
                          </div>
                          <div className="input-group">
                            <label>Banner Background Image URL</label>
                            <input type="text" className="input-field" value={settingsBannerImage} onChange={e => setSettingsBannerImage(e.target.value)} />
                          </div>
                          <div className="input-group">
                            <label>Contact Support Email</label>
                            <input type="email" className="input-field" value={settingsEmail} onChange={e => setSettingsEmail(e.target.value)} />
                          </div>
                          <div className="input-group">
                            <label>Contact Support Phone</label>
                            <input type="text" className="input-field" value={settingsPhone} onChange={e => setSettingsPhone(e.target.value)} />
                          </div>
                          <button type="submit" className="btn btn-primary">Save Branding Settings</button>
                        </form>
                      </div>

                      {/* Security / FAQ panel */}
                      <div className="flex flex-col gap-3">
                        {/* Change Admin Password */}
                        <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-md)' }}>
                          <h4 style={{ marginBottom: '16px' }}>Update Admin Password</h4>
                          {adminPassMessage && <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>{adminPassMessage}</p>}
                          <form onSubmit={handleAdminPasswordSubmit} className="flex flex-col gap-2">
                            <div className="input-group">
                              <label>Old Password</label>
                              <input type="password" placeholder="••••••••" className="input-field" value={oldAdminPass} onChange={e => setOldAdminPass(e.target.value)} required />
                            </div>
                            <div className="input-group">
                              <label>New Password</label>
                              <input type="password" placeholder="••••••••" className="input-field" value={newAdminPass} onChange={e => setNewAdminPass(e.target.value)} required />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--color-success)' }}>Update Password</button>
                          </form>
                        </div>

                        {/* FAQs Customizer */}
                        <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-md)' }}>
                          <div className="flex justify-between align-center" style={{ marginBottom: '16px' }}>
                            <h4 style={{ margin: 0 }}>Configure Homepage FAQs</h4>
                            <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={handleAddFaq}>+ Add FAQ</button>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                            {settingsFaqs.map(f => (
                              <div key={f.id} className="flex justify-between align-center" style={{ fontSize: '0.82rem', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                                <div style={{ maxWidth: '80%' }}>
                                  <strong>Q: {f.question}</strong>
                                  <p style={{ color: 'var(--text-secondary)' }}>{f.answer}</p>
                                </div>
                                <button className="btn-icon" onClick={() => handleRemoveFaq(f.id)} style={{ color: 'var(--color-danger)' }}>
                                  <Icons.Trash size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ADMIN PAYMENT MANAGEMENT */}
                {currentTab === 'admin_payments' && (
                  <div className="flex flex-col gap-4">
                    <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                      <h2>Payment Management Dashboard</h2>
                      <p style={{ color: 'var(--text-secondary)' }}>View revenue, manage transactions, process refunds, and export payment reports.</p>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      <div className="glass card-stat" style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
                        <div className="flex justify-between align-center">
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>TOTAL REVENUE</span>
                          <Icons.DollarSign size={20} style={{ color: 'var(--color-success)' }} />
                        </div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '8px 0 0 0' }}>
                          ₱{payments.filter(p => p.paymentStatus === 'paid').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                        </h2>
                      </div>

                      <div className="glass card-stat" style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
                        <div className="flex justify-between align-center">
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>DAILY REVENUE</span>
                          <Icons.Calendar size={20} style={{ color: 'var(--color-info)' }} />
                        </div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '8px 0 0 0' }}>
                          ₱{payments.filter(p => p.paymentStatus === 'paid' && new Date(p.createdAt).toDateString() === new Date().toDateString()).reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                        </h2>
                      </div>

                      <div className="glass card-stat" style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
                        <div className="flex justify-between align-center">
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>MONTHLY REVENUE</span>
                          <Icons.BarChart3 size={20} style={{ color: 'var(--color-warning)' }} />
                        </div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '8px 0 0 0' }}>
                          ₱{payments.filter(p => p.paymentStatus === 'paid' && new Date(p.createdAt).getMonth() === new Date().getMonth()).reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                        </h2>
                      </div>

                      <div className="glass card-stat" style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
                        <div className="flex justify-between align-center">
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>PENDING</span>
                          <Icons.Clock size={20} style={{ color: 'var(--color-danger)' }} />
                        </div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '8px 0 0 0' }}>
                          {payments.filter(p => p.paymentStatus === 'pending').length}
                        </h2>
                      </div>
                    </div>

                    <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-md)' }}>
                      <div className="flex justify-between align-center" style={{ marginBottom: '16px' }}>
                        <h4 style={{ margin: 0 }}>Payment Transactions</h4>
                        <div className="flex gap-2">
                          <div className="input-search-container" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: 'var(--radius-pill)', width: '240px', gap: '8px' }}>
                            <Icons.Search size={14} />
                            <input type="text" placeholder="Search transactions..." value={logSearchQuery} onChange={e => setLogSearchQuery(e.target.value)} style={{ border: 'none', background: 'none', color: 'var(--text-primary)', width: '100%', fontSize: '0.85rem' }} />
                          </div>
                          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => handleExportCSV('revenue')}>
                            <Icons.Download size={14} /> Export CSV
                          </button>
                        </div>
                      </div>

                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 700 }}>
                            <th style={{ padding: '10px 8px' }}>Booking ID</th>
                            <th style={{ padding: '10px 8px' }}>Property</th>
                            <th style={{ padding: '10px 8px' }}>Amount</th>
                            <th style={{ padding: '10px 8px' }}>Method</th>
                            <th style={{ padding: '10px 8px' }}>Status</th>
                            <th style={{ padding: '10px 8px' }}>Date</th>
                            <th style={{ padding: '10px 8px', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments
                            .filter(p => logSearchQuery === '' || 
                              (p.bookingId && p.bookingId.includes(logSearchQuery)) || 
                              (p.transactionId && p.transactionId.includes(logSearchQuery)) ||
                              (p.transactionRef && p.transactionRef.includes(logSearchQuery)))
                            .map(p => {
                              const booking = bookings.find(b => b.id === p.bookingId);
                              const prop = properties.find(x => x.id === booking?.propertyId);
                              const canRefund = p.paymentStatus === 'paid';
                              
                              return (
                                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                  <td style={{ padding: '10px 8px', fontFamily: 'monospace' }}>{p.bookingId?.slice(0, 8)}...</td>
                                  <td style={{ padding: '10px 8px' }}>{prop?.title || 'Unknown'}</td>
                                  <td style={{ padding: '10px 8px', fontWeight: 700, color: 'var(--color-primary)' }}>₱{Number(p.amount).toLocaleString()}</td>
                                  <td style={{ padding: '10px 8px' }}><span className="badge badge-info">{p.paymentMethod || p.method || 'N/A'}</span></td>
                                  <td style={{ padding: '10px 8px' }}>
                                    <span className={`badge ${
                                      p.paymentStatus === 'paid' ? 'badge-success' : 
                                      p.paymentStatus === 'failed' ? 'badge-danger' : 
                                      p.paymentStatus === 'refunded' || p.paymentStatus === 'partially_refunded' ? 'badge-warning' :
                                      'badge-secondary'
                                    }`}>
                                      {p.paymentStatus || 'pending'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '10px 8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(p.createdAt).toLocaleString()}</td>
                                  <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                                    <div className="flex gap-1 justify-end">
                                      <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => setSelectedReceiptBooking(booking)}>
                                        View Receipt
                                      </button>
                                      {canRefund && (
                                        <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => refundPayment(p.id, null)}>
                                          Process Refund
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          {payments.length === 0 && (
                            <tr>
                              <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                                No payment transactions recorded yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ADMIN SECURITY LOGS */}
                {currentTab === 'admin_logs' && (
                  <div className="flex flex-col gap-3">
                    <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                      <h2>Security Auditing & Event Logs</h2>
                      <p style={{ color: 'var(--text-secondary)' }}>Read persistent logs of admin and system actions.</p>
                    </div>

                    <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-md)' }}>
                      <div className="flex justify-between align-center" style={{ marginBottom: '16px' }}>
                        <div className="input-search-container" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: 'var(--radius-pill)', width: '320px', gap: '8px' }}>
                          <Icons.Search size={16} />
                          <input type="text" placeholder="Filter audit logs..." value={logSearchQuery} onChange={e => setLogSearchQuery(e.target.value)} style={{ border: 'none', background: 'none', color: 'var(--text-primary)', width: '100%', fontSize: '0.85rem' }} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {activityLogs
                          .filter(log => log.action.toLowerCase().includes(logSearchQuery.toLowerCase()) || log.details.toLowerCase().includes(logSearchQuery.toLowerCase()))
                          .map(log => (
                            <div key={log.id} style={{ display: 'flex', gap: '16px', fontSize: '0.82rem', padding: '10px 14px', borderBottom: '1px solid var(--border-color)' }}>
                              <span style={{ color: 'var(--text-tertiary)', minWidth: '130px' }}>{new Date(log.timestamp).toLocaleString()}</span>
                              <strong style={{ minWidth: '150px' }}>{log.action}</strong>
                              <span style={{ color: 'var(--text-secondary)' }}>{log.details}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* CHECKOUT MODAL FLOW */}
      {showCheckoutModal && (
        <div className="modal-overlay" onClick={() => setShowCheckoutModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <button className="btn-icon" onClick={() => setShowCheckoutModal(false)} style={{ position: 'absolute', top: '16px', right: '16px' }}>
              <Icons.X size={20} />
            </button>

            <h3 style={{ marginBottom: '16px' }}>Secure Checkout & Payment</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>Choose your preferred payment method to complete booking.</p>

            <div className="flex flex-col gap-3">
              {paymentMethods.map(method => (
                <label key={method.value} className="flex align-center gap-3" style={{ cursor: 'pointer', padding: '12px 16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.value}
                    checked={checkoutMethod === method.value}
                    onChange={e => setCheckoutMethod(e.target.value)}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <div className="flex align-center gap-2" style={{ flexGrow: 1 }}>
                    {renderIcon(method.icon, 18)}
                    <span style={{ fontWeight: 500 }}>{method.label}</span>
                  </div>
                </label>
              ))}
            </div>

            <button className="btn btn-primary" style={{ width: '100%', marginTop: '24px' }} onClick={handleConfirmPayment} disabled={checkoutLoading}>
              {checkoutLoading ? 'Redirecting to Payment Gateway...' : 'Proceed to Payment'}
            </button>
          </div>
        </div>
      )}

      {/* CONFIRMED BOOKING MODAL SUCCESS */}
      {bookingConfirmedRef && (
        <div className="modal-overlay" onClick={() => setBookingConfirmedRef(null)}>
          <div className="modal-content" style={{ textAlign: 'center', maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <Icons.CheckCircle size={48} color="var(--color-success)" style={{ margin: '0 auto 16px auto' }} />
            <h3>Stay Confirmed Instantly!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '8px' }}>
              Your reservation request for <strong>{properties.find(p => p.id === bookingConfirmedRef.propertyId)?.title}</strong> has been confirmed successfully.
            </p>
            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px dashed var(--border-color)',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'monospace',
              margin: '16px 0',
              fontWeight: 700
            }}>
              Reference: {bookingConfirmedRef.id}
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => { setBookingConfirmedRef(null); handleNavigate('guest_dashboard'); }}>
              View My Dashboard
            </button>
          </div>
        </div>
      )}

      {/* SIMULATED EMAIL CONFIRMATION MODAL */}
      {emailSentModalInfo && (
        <div className="modal-overlay no-print" onClick={() => setEmailSentModalInfo(null)} style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '600px', padding: '0px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ backgroundColor: 'var(--color-success)', color: 'white', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icons.Mail size={20} /> Simulated Confirmation Email Sent Automatically
              </h4>
              <button className="btn-icon" onClick={() => setEmailSentModalInfo(null)} style={{ color: 'white' }}>
                <Icons.X size={18} />
              </button>
            </div>
            <div style={{ padding: '24px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
                <p><strong>From:</strong> HavenShare Booking Escrow &lt;booking-service@havenshare.com&gt;</p>
                <p><strong>To:</strong> &lt;{emailSentModalInfo.userEmail}&gt;</p>
                <p style={{ marginTop: '4px' }}><strong>Subject:</strong> ✅ Instant Confirmation: Your Stay Receipt #{emailSentModalInfo.bookingId}</p>
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}>
                <h4 style={{ color: 'var(--color-success)', marginTop: 0, marginBottom: '10px' }}>Your Reservation is Confirmed!</h4>
                <p>Dear Guest, your instant booking payment has been verified. Here is your checkout receipt details:</p>
                
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px', fontSize: '0.85rem' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '8px 0', fontWeight: 600 }}>Property Stay:</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>{emailSentModalInfo.propertyTitle}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '8px 0', fontWeight: 600 }}>Rentable Option:</td>
                      <td style={{ padding: '8px 0', textAlign: 'right', color: 'var(--color-primary)', fontWeight: 700 }}>{emailSentModalInfo.unitName}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '8px 0', fontWeight: 600 }}>Duration Check:</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>{emailSentModalInfo.checkIn} to {emailSentModalInfo.checkOut}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px 0', fontWeight: 700 }}>Escrow Paid Total:</td>
                      <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)' }}>₱{emailSentModalInfo.price.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ marginTop: '20px', padding: '12px', background: 'var(--bg-primary)', borderLeft: '3px solid var(--color-success)', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}>
                  ✓ Security escrow verified automatically. Door lock codes will be dispatched 24 hours prior check-in.
                </div>
              </div>
            </div>
            <div style={{ padding: '16px 24px', textAlign: 'right', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setEmailSentModalInfo(null)}>
                Got it, thanks!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT / INVOICE VIEW MODAL */}
      {selectedReceiptBooking && (
        <div className="modal-overlay no-print" onClick={() => setSelectedReceiptBooking(null)}>
          <div className="modal-content" style={{ maxWidth: '650px', padding: '0px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            {/* Header toolbar */}
            <div className="flex justify-between align-center no-print" style={{ padding: '16px 24px', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ fontWeight: 700 }}>Reservation Invoice Receipt</span>
              <div className="flex gap-2">
                <button className="btn btn-secondary" style={{ padding: '6px 12px' }} onClick={() => window.print()}>
                  Print / Save PDF
                </button>
                <button className="btn-icon" onClick={() => setSelectedReceiptBooking(null)}>
                  <Icons.X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Receipt Layout */}
            <div className="print-only" style={{ padding: '40px' }}>
              <div className="flex justify-between align-center" style={{ borderBottom: '2px solid var(--color-primary)', paddingBottom: '20px', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>HavenShare</h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Escrow Booking Invoice Receipt</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Reservation ID</span>
                  <p style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{selectedReceiptBooking.id}</p>
                </div>
              </div>

              {/* Grid details */}
              <div className="grid grid-cols-2 gap-3" style={{ marginBottom: '24px', fontSize: '0.9rem' }}>
                <div>
                  <span style={{ color: 'var(--text-tertiary)', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700 }}>Stay Information</span>
                  <h4 style={{ margin: '4px 0 2px 0' }}>{properties.find(p => p.id === selectedReceiptBooking.propertyId)?.title}</h4>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    {properties.find(p => p.id === selectedReceiptBooking.propertyId)?.location.address}, {properties.find(p => p.id === selectedReceiptBooking.propertyId)?.location.city}
                  </p>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Guests: <strong>{selectedReceiptBooking.guestsCount}</strong>
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: 'var(--text-tertiary)', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700 }}>Stay Duration</span>
                  <p style={{ margin: '4px 0 2px 0' }}>Check-In: <strong>{selectedReceiptBooking.checkIn}</strong></p>
                  <p>Check-Out: <strong>{selectedReceiptBooking.checkOut}</strong></p>
                </div>
              </div>

              {/* Price Table breakdown */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', marginBottom: '24px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 0' }}>Description</th>
                    <th style={{ padding: '8px 0', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 0' }}>Rental base nights stay</td>
                    <td style={{ padding: '12px 0', textAlign: 'right' }}>
                      ₱{(selectedReceiptBooking.totalPrice - Math.round(selectedReceiptBooking.totalPrice * 0.08) - Math.round(selectedReceiptBooking.totalPrice * 0.05)).toLocaleString()}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 0' }}>Tourism Taxes & Duties (8%)</td>
                    <td style={{ padding: '12px 0', textAlign: 'right' }}>₱{Math.round(selectedReceiptBooking.totalPrice * 0.08).toLocaleString()}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 0' }}>Booking Fee & Platform services</td>
                    <td style={{ padding: '12px 0', textAlign: 'right' }}>₱{Math.round(selectedReceiptBooking.totalPrice * 0.05).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-between align-center" style={{ borderTop: '2px solid var(--text-primary)', paddingTop: '16px' }}>
                <span className="badge badge-success" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>Paid escrow verified</span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Amount Paid</span>
                  <h2 style={{ color: 'var(--color-primary)', margin: 0 }}>₱{selectedReceiptBooking.totalPrice.toLocaleString()}</h2>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN PROPERTY EDIT / ADD MODAL FORM */}
      {showPropertyFormModal && (
        <div className="modal-overlay" onClick={() => setShowPropertyFormModal(null)}>
          <div className="modal-content" style={{ maxWidth: '750px' }} onClick={e => e.stopPropagation()}>
            <button className="btn-icon" onClick={() => setShowPropertyFormModal(null)} style={{ position: 'absolute', top: '16px', right: '16px' }}>
              <Icons.X size={20} />
            </button>

            <h3 style={{ marginBottom: '20px' }}>
              {showPropertyFormModal === 'add' ? 'Add New Property Listing' : 'Edit Property Listing Details'}
            </h3>

            {propFormError && (
              <div style={{ color: 'var(--color-danger)', fontSize: '0.88rem', fontWeight: 600, marginBottom: '16px' }}>{propFormError}</div>
            )}

            <form onSubmit={handleSaveProperty} className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2" style={{ gap: '16px' }}>
                <div className="input-group">
                  <label>Listing Title *</label>
                  <input type="text" className="input-field" placeholder="Villa Azure - Cliffside Infinity Pool" value={propFormTitle} onChange={e => setPropFormTitle(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label>Category *</label>
                  <select className="input-field" value={propFormCategory} onChange={e => setPropFormCategory(e.target.value)}>
                    <option value="Beachfront">Beachfront</option>
                    <option value="Cabins">Cabins</option>
                    <option value="Trending">Trending</option>
                    <option value="Countryside">Countryside</option>
                    <option value="Treehouses">Treehouses</option>
                    <option value="Mansions">Mansions</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label>Listing Description *</label>
                <textarea rows="3" className="input-field" placeholder="Provide a detailed description of features, surroundings, bedding..." value={propFormDesc} onChange={e => setPropFormDesc(e.target.value)} required />
              </div>

              <div className="grid grid-cols-4 gap-2" style={{ gap: '12px' }}>
                <div className="input-group">
                  <label>Base Price (₱) *</label>
                  <input type="number" className="input-field" value={propFormPrice} onChange={e => setPropFormPrice(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label>Beds Count *</label>
                  <input type="number" className="input-field" value={propFormBeds} onChange={e => setPropFormBeds(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label>Baths Count *</label>
                  <input type="number" className="input-field" value={propFormBaths} onChange={e => setPropFormBaths(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label>Guests Capacity *</label>
                  <input type="number" className="input-field" value={propFormGuests} onChange={e => setPropFormGuests(e.target.value)} required />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2" style={{ gap: '12px' }}>
                <div className="input-group">
                  <label>Street Address *</label>
                  <input type="text" className="input-field" value={propFormAddress} onChange={e => setPropFormAddress(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label>City *</label>
                  <input type="text" className="input-field" value={propFormCity} onChange={e => setPropFormCity(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label>Country *</label>
                  <input type="text" className="input-field" value={propFormCountry} onChange={e => setPropFormCountry(e.target.value)} required />
                </div>
              </div>

              {/* Photo Upload Manager */}
              <div style={{ margin: '8px 0', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px', backgroundColor: 'var(--bg-secondary)' }}>
                <h4 style={{ marginBottom: '12px', fontSize: '0.9rem' }}>Upload Listing Media</h4>
                <div className="grid grid-cols-2 gap-2" style={{ gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>COVER IMAGE FILE</label>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover')} style={{ display: 'block', margin: '4px 0 10px 0' }} />
                    {propFormCoverUrl && <img src={propFormCoverUrl} alt="Cover Preview" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />}
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>ADDITIONAL GALLERY IMAGES</label>
                    <input type="file" accept="image/*" multiple onChange={(e) => handleImageUpload(e, 'secondary')} style={{ display: 'block', margin: '4px 0 10px 0' }} />
                    <div className="flex gap-2">
                      {propFormSecondaryUrls.map((url, idx) => url && (
                        <img key={idx} src={url} alt="Gallery Preview" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Seasonal pricing customizer */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '8px' }}>
                <h4 style={{ marginBottom: '12px', fontSize: '0.9rem' }}>Seasonal Adjustments & Multipliers</h4>
                <div className="flex gap-2 align-center" style={{ marginBottom: '12px' }}>
                  <select className="input-field" style={{ width: '130px' }} value={newSeasonalMonth} onChange={e => setNewSeasonalMonth(e.target.value)}>
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                      <option key={i} value={i + 1}>{m}</option>
                    ))}
                  </select>
                  <input type="number" className="input-field" style={{ width: '120px' }} step="0.05" min="0.5" max="3" value={newSeasonalMult} onChange={e => setNewSeasonalMult(e.target.value)} placeholder="Multiplier" />
                  <button type="button" className="btn btn-secondary" onClick={handleAddSeasonalRule}>Add Rate</button>
                </div>
                <div className="flex gap-2 wrap">
                  {propFormSeasonal.map(r => (
                    <span key={r.month} className="badge badge-info" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      Month {r.month}: {r.multiplier || r.priceMultiplier}x
                      <Icons.X size={12} style={{ cursor: 'pointer' }} onClick={() => handleRemoveSeasonalRule(r.month)} />
                    </span>
                  ))}
                </div>
              </div>

              {/* Discount Tiers customizer */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '12px' }}>
                <h4 style={{ marginBottom: '12px', fontSize: '0.9rem' }}>Duration Discount Rules</h4>
                <div className="flex gap-2 align-center" style={{ marginBottom: '12px' }}>
                  <input type="number" className="input-field" style={{ width: '130px' }} min="1" value={newDiscountDays} onChange={e => setNewDiscountDays(e.target.value)} placeholder="Min Nights" />
                  <input type="number" className="input-field" style={{ width: '120px' }} min="1" max="99" value={newDiscountPct} onChange={e => setNewDiscountPct(e.target.value)} placeholder="Discount %" />
                  <button type="button" className="btn btn-secondary" onClick={handleAddDiscountRule}>Add Rule</button>
                </div>
                <div className="flex gap-2 wrap">
                  {propFormDiscounts.map(d => (
                    <span key={d.minDays} className="badge badge-success" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {d.minDays}+ Nights: -{d.percentage}%
                      <Icons.X size={12} style={{ cursor: 'pointer' }} onClick={() => handleRemoveDiscountRule(d.minDays)} />
                    </span>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                {showPropertyFormModal === 'add' ? 'Publish Property Listing' : 'Save Property Modifications'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN PROPERTY UNIT EDIT / ADD MODAL FORM */}
      {showUnitFormModal && (
        <div className="modal-overlay" onClick={() => setShowUnitFormModal(null)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <button className="btn-icon" onClick={() => setShowUnitFormModal(null)} style={{ position: 'absolute', top: '16px', right: '16px' }}>
              <Icons.X size={20} />
            </button>

            <h3 style={{ marginBottom: '20px' }}>
              {showUnitFormModal === 'add' ? 'Add Unit Option' : 'Edit Unit Details'}
            </h3>

            {unitFormError && (
              <div style={{ color: 'var(--color-danger)', fontSize: '0.88rem', fontWeight: 600, marginBottom: '16px' }}>{unitFormError}</div>
            )}

            <form onSubmit={handleSaveUnit} className="flex flex-col gap-2">
              <div className="input-group">
                <label>Select Parent Property *</label>
                <select className="input-field" value={unitFormPropertyId} onChange={e => setUnitFormPropertyId(e.target.value)} required>
                  <option value="">-- Choose Property --</option>
                  {properties.filter(p => p.status !== 'archived').map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2" style={{ gap: '16px' }}>
                <div className="input-group">
                  <label>Unit/Room Name *</label>
                  <input type="text" className="input-field" placeholder="e.g. Queen Room, Entire Villa" value={unitFormName} onChange={e => setUnitFormName(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label>Unit Type *</label>
                  <select className="input-field" value={unitFormType} onChange={e => setUnitFormType(e.target.value)} required>
                    <option value="Room">Room</option>
                    <option value="Entire Property">Entire Property</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label>Unit Description</label>
                <textarea rows="3" className="input-field" placeholder="Describe the unit layout, bed sizes, private exits..." value={unitFormDesc} onChange={e => setUnitFormDesc(e.target.value)} />
              </div>

              <div className="grid grid-cols-3 gap-2" style={{ gap: '12px' }}>
                <div className="input-group">
                  <label>Price per Night (₱) *</label>
                  <input type="number" className="input-field" value={unitFormPrice} onChange={e => setUnitFormPrice(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label>Max Guests Capacity *</label>
                  <input type="number" className="input-field" value={unitFormMaxGuests} onChange={e => setUnitFormMaxGuests(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label>Unit Status</label>
                  <select className="input-field" value={unitFormStatus} onChange={e => setUnitFormStatus(e.target.value)}>
                    <option value="available">available</option>
                    <option value="blocked">blocked</option>
                  </select>
                </div>
              </div>

              <div style={{ margin: '8px 0', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px', backgroundColor: 'var(--bg-secondary)' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>UNIT/ROOM PHOTO</label>
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'unit')} style={{ display: 'block', marginBottom: '10px' }} />
                {unitFormPhotoUrl && <img src={unitFormPhotoUrl} alt="Unit Preview" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px' }} />}
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                {showUnitFormModal === 'add' ? 'Publish Rentable Unit' : 'Save Unit Modifications'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <DbProvider>
      <AppContent />
    </DbProvider>
  );
}
