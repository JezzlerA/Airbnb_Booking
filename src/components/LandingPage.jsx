import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import * as Icons from 'lucide-react';

export default function LandingPage({
  onPropertySelect,
  searchQuery,
  setSearchQuery,
  onNavigate
}) {
  const { properties, propertyImages, reviews, amenities, settings } = useDb();

  // Search & Filter State
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guestCount, setGuestCount] = useState('1');
  const [priceFilter, setPriceFilter] = useState(10000);
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  // Accordion State
  const [openFaqId, setOpenFaqId] = useState(1);

  // Testimonial Carousel State
  const [activeTestimonialIndex, setActiveTestimonialIndex] = useState(0);

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);

  // Icon helper
  const renderIcon = (name, size = 24, color = 'currentColor') => {
    const Icon = Icons[name] || Icons.CheckCircle;
    return <Icon size={size} color={color} />;
  };

  // Calculate Average Rating
  const getAverageRating = (pId) => {
    const propReviews = reviews.filter(r => r.propertyId === pId);
    if (propReviews.length === 0) return 4.9;
    const sum = propReviews.reduce((s, r) => s + r.rating, 0);
    return (sum / propReviews.length).toFixed(1);
  };

  // Filter Properties
  const filteredProperties = properties.filter(p => {
    if (p.status === 'archived') return false;

    const matchesSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.country.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesPrice = p.pricePerNight <= priceFilter;
    const matchesGuests = Number(guestCount) <= p.guests;
    const matchesAmenities = selectedAmenities.every(aId => p.amenities.includes(aId));

    return matchesSearch && matchesCategory && matchesPrice && matchesGuests && matchesAmenities;
  });

  // Sample Testimonials
  const testimonials = [
    {
      id: 1,
      name: 'Sophia Martinez',
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      rating: 5,
      review: 'Our stay at Villa Azure was nothing short of miraculous. The sunset views over the infinity pool were breathtaking, and the instant booking process was seamless!',
      date: 'July 2026'
    },
    {
      id: 2,
      name: 'Marcus Vance',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      rating: 5,
      review: 'The Alpine Glass Cabin was the perfect retreat for our family. Cozy fireplace, spotless rooms, and top-notch customer support. Highly recommended!',
      date: 'June 2026'
    },
    {
      id: 3,
      name: 'Elena Rostova',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      rating: 5,
      review: 'Booking through HavenShare was ridiculously fast and safe. The Central Park Penthouse exceeded all expectations. We will definitely book again!',
      date: 'May 2026'
    }
  ];

  // Sample FAQs
  const faqs = [
    {
      id: 1,
      question: 'How do I book a room or property?',
      answer: 'Simply browse our featured properties, choose your preferred stay, select your check-in and check-out dates, and click "Book Now". You will be prompted to log in or create a free guest account to finalize your reservation with instant confirmation.'
    },
    {
      id: 2,
      question: 'What payment methods are accepted?',
      answer: 'We accept all major secure payment gateways including GCash, Maya, Credit & Debit Cards (Visa, MasterCard), PayPal, Apple Pay, Google Pay, and Direct Bank Transfers.'
    },
    {
      id: 3,
      question: 'What is the cancellation policy?',
      answer: 'Cancellations made up to 48 hours prior to check-in are eligible for a full refund. You can manage or cancel your stays directly from your Guest Profile Dashboard.'
    },
    {
      id: 4,
      question: 'What time is check-in and check-out?',
      answer: 'Standard check-in time starts at 2:00 PM on your arrival date, and check-out is by 11:00 AM on your departure date. Early check-in or late check-out options can be arranged upon request.'
    }
  ];

  // Features list for "Why Choose Us"
  const whyChooseUsFeatures = [
    { icon: 'Zap', title: 'Instant Confirmation', desc: 'Lock in your reservation immediately with zero wait times.' },
    { icon: 'ShieldCheck', title: 'Secure Online Payments', desc: '256-bit encrypted transactions for ultimate peace of mind.' },
    { icon: 'Sparkles', title: 'Comfortable Rooms', desc: 'Premium bedding, designer interiors, and luxury amenities.' },
    { icon: 'Headphones', title: '24/7 Customer Care', desc: 'Dedicated concierge and host support whenever you need assistance.' },
    { icon: 'MapPin', title: 'Prime Locations', desc: 'Properties situated in prime beachfront, mountain, and city spots.' },
    { icon: 'CheckCircle2', title: 'Clean & Safe Stay', desc: 'Strict multi-point hygiene protocols performed prior to every stay.' }
  ];

  // Featured Amenities
  const landingAmenities = [
    { icon: 'Wifi', name: 'Free High-Speed Wi-Fi', desc: 'Seamless streaming & work connectivity' },
    { icon: 'Wind', name: 'Air Conditioning', desc: 'Climate controlled comfort in every room' },
    { icon: 'Waves', name: 'Swimming Pool', desc: 'Private heated infinity pools & poolsides' },
    { icon: 'ChefHat', name: 'Fully Equipped Kitchen', desc: 'Modern appliances, cookware & coffee maker' },
    { icon: 'Car', name: 'Free Private Parking', desc: 'Secure indoor & outdoor parking on site' },
    { icon: 'Tv', name: 'Smart TV & Cable', desc: '4K Ultra HD screens with Netflix & channels' },
    { icon: 'Bath', name: 'Hot Shower & Spa', desc: 'Rainfall showers, luxury toiletries & hot tubs' },
    { icon: 'Trees', name: 'Private Garden', desc: 'Lush greenery, lawns & relaxation outdoor decks' },
    { icon: 'Flame', name: 'BBQ & Grill Area', desc: 'Outdoor dining tables & barbecue setups' }
  ];

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSuccess(true);
    setContactName('');
    setContactEmail('');
    setContactSubject('');
    setContactMessage('');
    setTimeout(() => setContactSuccess(false), 6000);
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-page-wrapper flex flex-col gap-4">
      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 1. HERO SECTION */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <section id="hero" className="hero-container" style={{
        backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.45) 0%, rgba(15, 23, 42, 0.85) 100%), url(${settings.bannerImage || '/beach_villa.png'})`
      }}>
        <div className="hero-content">
          <span className="badge badge-info" style={{ marginBottom: '16px', background: 'rgba(255, 255, 255, 0.2)', border: '1px solid rgba(255, 255, 255, 0.3)', color: '#fff', padding: '6px 16px', fontSize: '0.85rem' }}>
            ✨ Extraordinary Stays & Vacation Rentals
          </span>
          <h1 className="hero-headline">Find Your Perfect Stay</h1>
          <p className="hero-subheading">
            Book comfortable and affordable accommodations with instant confirmation and secure online payment.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '32px' }}>
            <button 
              onClick={() => scrollToSection('properties')} 
              className="btn btn-primary"
              style={{ padding: '14px 32px', fontSize: '1.05rem', borderRadius: 'var(--radius-pill)' }}
            >
              Book Now <Icons.ArrowDown size={18} />
            </button>
            <button 
              onClick={() => scrollToSection('about')} 
              className="btn"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', padding: '14px 28px', fontSize: '1.05rem', borderRadius: 'var(--radius-pill)', backdropFilter: 'blur(10px)' }}
            >
              Explore Business <Icons.ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Hero Search Bar Form */}
        <div className="hero-search-bar">
          <div className="search-field">
            <label>Destination / Property</label>
            <input 
              type="text"
              placeholder="Where are you going?"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="search-field">
            <label>Check-in</label>
            <input 
              type="date" 
              value={checkInDate}
              onChange={e => setCheckInDate(e.target.value)}
            />
          </div>

          <div className="search-field">
            <label>Check-out</label>
            <input 
              type="date" 
              value={checkOutDate}
              onChange={e => setCheckOutDate(e.target.value)}
            />
          </div>

          <div className="search-field">
            <label>Guests</label>
            <select value={guestCount} onChange={e => setGuestCount(e.target.value)}>
              {[1, 2, 3, 4, 5, 6, 8, 10].map(n => (
                <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>
              ))}
            </select>
          </div>

          <button 
            type="button"
            className="btn btn-primary"
            onClick={() => scrollToSection('properties')}
            style={{ borderRadius: 'var(--radius-pill)', padding: '14px 24px' }}
          >
            <Icons.Search size={18} /> Search Availability
          </button>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 2. FEATURED PROPERTIES SECTION */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <section id="properties" style={{ paddingTop: '32px' }}>
        <div className="section-title-block">
          <span className="section-subtitle">Handpicked Stays</span>
          <h2>Featured Rental Properties</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', maxWidth: '600px', margin: '8px auto 0 auto' }}>
            Discover our curated portfolio of world-class villas, mountain chalets, and skyline penthouses.
          </p>
        </div>

        {/* Category Scroller Filter */}
        <div className="category-scroller">
          <button
            className={`category-tab ${categoryFilter === 'All' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('All')}
          >
            {renderIcon('Globe', 22)}
            <span>All Stays</span>
          </button>
          {(settings.categories || ['Beachfront', 'Cabins', 'Trending', 'Countryside', 'Treehouses', 'Mansions']).map(cat => (
            <button
              key={cat}
              className={`category-tab ${categoryFilter === cat ? 'active' : ''}`}
              onClick={() => setCategoryFilter(cat)}
            >
              {renderIcon(
                cat === 'Beachfront' ? 'Waves' : 
                cat === 'Cabins' ? 'Home' : 
                cat === 'Trending' ? 'TrendingUp' : 
                cat === 'Countryside' ? 'Wind' : 'Trees'
              , 22)}
              <span>{cat}</span>
            </button>
          ))}
        </div>

        {/* Filter Controls Row */}
        <div className="glass" style={{ padding: '16px 24px', borderRadius: 'var(--radius-md)', marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div className="flex align-center gap-3">
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Max Price: <strong style={{ color: 'var(--color-primary)' }}>₱{priceFilter.toLocaleString()}</strong></span>
            <input 
              type="range" 
              min="100" 
              max="50000" 
              step="100" 
              value={priceFilter}
              onChange={e => setPriceFilter(Number(e.target.value))}
              style={{ accentColor: 'var(--color-primary)', width: '160px', cursor: 'pointer' }}
            />
          </div>

          <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Showing <strong>{filteredProperties.length}</strong> available properties
          </span>
        </div>

        {/* Properties Grid */}
        {filteredProperties.length === 0 ? (
          <div className="glass" style={{ textAlign: 'center', padding: '64px', borderRadius: 'var(--radius-md)' }}>
            <Icons.AlertCircle size={48} style={{ color: 'var(--text-tertiary)', marginBottom: '16px' }} />
            <h3>No matching properties found</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Try widening your search terms or filter rules.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {filteredProperties.map(p => {
              const coverImg = propertyImages.find(img => img.propertyId === p.id && img.isCover)?.url || '/beach_villa.png';
              const avgRating = getAverageRating(p.id);

              return (
                <div 
                  key={p.id} 
                  className="property-card"
                  style={{ display: 'flex', flexDirection: 'column' }}
                >
                  <div className="property-card-image-container" onClick={() => onPropertySelect(p.id)}>
                    <img src={coverImg} alt={p.title} className="property-card-image" loading="lazy" />
                    <div className="property-card-heart">
                      <Icons.Heart size={20} fill="rgba(0,0,0,0.3)" />
                    </div>
                    <span className="badge badge-success" style={{ position: 'absolute', bottom: '12px', left: '12px', zIndex: 3, boxShadow: 'var(--shadow-sm)' }}>
                      Instant Book
                    </span>
                  </div>

                  <div className="property-card-info" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div className="property-card-header">
                        <h4 className="property-card-title">{p.title}</h4>
                        <div className="property-card-rating">
                          <Icons.Star size={14} fill="var(--color-warning)" stroke="var(--color-warning)" />
                          <span>{avgRating}</span>
                        </div>
                      </div>

                      <div className="property-card-location">
                        <Icons.MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} />
                        {p.location.city}, {p.location.country}
                      </div>

                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '8px 0 12px 0', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {p.description}
                      </p>

                      <div className="property-card-details" style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
                        {p.beds} Beds • {p.baths} Baths • Up to {p.guests} Guests
                      </div>
                    </div>

                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div className="property-card-price">
                        ₱{p.pricePerNight.toLocaleString()} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 400 }}>/ night</span>
                      </div>
                      <button 
                        onClick={() => onPropertySelect(p.id)}
                        className="btn btn-secondary" 
                        style={{ fontSize: '0.85rem', padding: '8px 16px' }}
                      >
                        View Details <Icons.ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 3. WHY CHOOSE US SECTION */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <section id="why-choose-us" style={{ paddingTop: '64px' }}>
        <div className="section-title-block">
          <span className="section-subtitle">Unmatched Hospitality</span>
          <h2>Why Choose HavenShare?</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            We provide exceptional vacation rental experiences tailored to your comfort and peace of mind.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {whyChooseUsFeatures.map((item, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon-wrapper">
                {renderIcon(item.icon, 28)}
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{item.title}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 4. AMENITIES SECTION */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <section id="amenities" style={{ paddingTop: '64px' }}>
        <div className="section-title-block">
          <span className="section-subtitle">Comfort & Convenience</span>
          <h2>Premium Stays Amenities</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            All our accommodations come fully equipped with high-standard amenities for a relaxing getaway.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {landingAmenities.map((a, idx) => (
            <div key={idx} className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-md)', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ padding: '12px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: 'var(--radius-sm)' }}>
                {renderIcon(a.icon, 24)}
              </div>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{a.name}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{a.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 5. BOOKING PROCESS SECTION */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <section id="booking-process" style={{ paddingTop: '64px' }}>
        <div className="section-title-block">
          <span className="section-subtitle">Simple 4-Step Journey</span>
          <h2>How Booking Works</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            Reserving your dream getaway is effortless and takes only a few minutes.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-3" style={{ position: 'relative' }}>
          {[
            { step: '01', icon: 'Search', title: 'Browse Properties', desc: 'Explore our curated collection of verified rentals by location, price, and amenities.' },
            { step: '02', icon: 'Calendar', title: 'Select Dates', desc: 'Pick your check-in and check-out dates along with the total guest capacity.' },
            { step: '03', icon: 'CreditCard', title: 'Pay Securely', desc: 'Checkout using your preferred payment method with instant automated receipts.' },
            { step: '04', icon: 'Sparkles', title: 'Enjoy Your Stay', desc: 'Receive self check-in details and immerse yourself in an unforgettable experience.' }
          ].map((s, idx) => (
            <div key={idx} className="step-card">
              <span className="step-number-badge">Step {s.step}</span>
              <div className="feature-icon-wrapper" style={{ marginTop: '12px' }}>
                {renderIcon(s.icon, 28)}
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '8px 0 4px 0' }}>{s.title}</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 6. TESTIMONIALS SECTION */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <section id="reviews" style={{ paddingTop: '64px' }}>
        <div className="section-title-block">
          <span className="section-subtitle">Guest Experiences</span>
          <h2>What Our Guests Say</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            Real reviews from real travelers who booked their stays through HavenShare.
          </p>
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
          <div className="testimonial-card">
            <div className="flex justify-between align-center">
              <div className="flex align-center gap-2">
                <img 
                  src={testimonials[activeTestimonialIndex].photo} 
                  alt={testimonials[activeTestimonialIndex].name} 
                  style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{testimonials[activeTestimonialIndex].name}</h4>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Booked in {testimonials[activeTestimonialIndex].date}</span>
                </div>
              </div>

              <div className="flex gap-1">
                {Array.from({ length: testimonials[activeTestimonialIndex].rating }).map((_, i) => (
                  <Icons.Star key={i} size={18} fill="var(--color-warning)" stroke="var(--color-warning)" />
                ))}
              </div>
            </div>

            <p style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: 1.6 }}>
              "{testimonials[activeTestimonialIndex].review}"
            </p>

            <div className="flex align-center justify-between" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
              <div className="flex gap-2">
                {testimonials.map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => setActiveTestimonialIndex(i)}
                    style={{
                      width: i === activeTestimonialIndex ? '28px' : '10px',
                      height: '10px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: i === activeTestimonialIndex ? 'var(--color-primary)' : 'var(--border-color)',
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                <button 
                  className="btn-icon" 
                  onClick={() => setActiveTestimonialIndex(prev => (prev === 0 ? testimonials.length - 1 : prev - 1))}
                >
                  <Icons.ChevronLeft size={20} />
                </button>
                <button 
                  className="btn-icon" 
                  onClick={() => setActiveTestimonialIndex(prev => (prev === testimonials.length - 1 ? 0 : prev + 1))}
                >
                  <Icons.ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 7. ABOUT US SECTION */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <section id="about" style={{ paddingTop: '64px' }}>
        <div className="grid grid-cols-2 gap-4 align-center">
          <div>
            <span className="section-subtitle">Our Business Story</span>
            <h2 style={{ fontSize: '2.2rem', marginBottom: '16px' }}>Redefining Vacation Rentals & Property Management</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.98rem', marginBottom: '16px' }}>
              HavenShare was founded with a single mission: to blend boutique luxury hospitality with seamless digital technology. We partner with premier property hosts to curate exceptional living spaces across coastal retreats, urban penthouses, and peaceful mountain chalets.
            </p>
            
            <div className="grid grid-cols-2 gap-2" style={{ marginTop: '24px' }}>
              <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ color: 'var(--color-primary)', fontSize: '1.2rem', marginBottom: '6px' }}>Our Mission</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Deliver world-class booking technology and unforgettable stay experiences.</p>
              </div>
              <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ color: 'var(--color-info)', fontSize: '1.2rem', marginBottom: '6px' }}>Our Vision</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Become the global benchmark for modern, transparent rental management.</p>
              </div>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              height: '420px'
            }}>
              <img src="/beach_villa.png" alt="Beach Villa" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <img src="/mountain_cabin.png" alt="Cabin" style={{ width: '100%', height: 'calc(50% - 8px)', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                <img src="/urban_penthouse.png" alt="Penthouse" style={{ width: '100%', height: 'calc(50% - 8px)', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 8. FAQ SECTION */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <section id="faq" style={{ paddingTop: '64px' }}>
        <div className="section-title-block">
          <span className="section-subtitle">Got Questions?</span>
          <h2>Frequently Asked Questions</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            Find quick answers to common questions regarding reservations, payments, and stay rules.
          </p>
        </div>

        <div style={{ maxWidth: '840px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {faqs.map(faq => (
            <div key={faq.id} className="faq-item">
              <div 
                className="faq-header"
                onClick={() => setOpenFaqId(openFaqId === faq.id ? null : faq.id)}
              >
                <span>{faq.question}</span>
                {openFaqId === faq.id ? <Icons.ChevronUp size={20} color="var(--color-primary)" /> : <Icons.ChevronDown size={20} />}
              </div>
              {openFaqId === faq.id && (
                <div className="faq-body">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 9. CONTACT SECTION */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <section id="contact" style={{ paddingTop: '64px' }}>
        <div className="section-title-block">
          <span className="section-subtitle">Get in Touch</span>
          <h2>Contact Our Support Team</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            Have a custom inquiry or host partnership question? Send us a message anytime.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Contact Details & Map Card */}
          <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h3 style={{ marginBottom: '16px' }}>Contact Information</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                Our hospitality concierge is ready to assist you 24 hours a day, 7 days a week.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex align-center gap-2">
                <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                  <Icons.MapPin size={20} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.9rem', display: 'block' }}>Business Address</strong>
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>24800 Pacific Coast Hwy, Malibu, CA 90265</span>
                </div>
              </div>

              <div className="flex align-center gap-2">
                <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', background: 'var(--color-info-bg)', color: 'var(--color-info)' }}>
                  <Icons.Phone size={20} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.9rem', display: 'block' }}>Phone Number</strong>
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{settings.contactPhone || '+1 (800) 555-0199'}</span>
                </div>
              </div>

              <div className="flex align-center gap-2">
                <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
                  <Icons.Mail size={20} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.9rem', display: 'block' }}>Email Address</strong>
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{settings.contactEmail || 'support@havenshare.com'}</span>
                </div>
              </div>
            </div>

            {/* Google Map Mock/Embed View */}
            <div style={{ height: '180px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative' }}>
              <iframe 
                title="Google Map Location"
                src="https://maps.google.com/maps?q=Malibu,CA&t=&z=13&ie=UTF8&iwloc=&output=embed"
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen="" 
                loading="lazy" 
              />
            </div>
          </div>

          {/* Interactive Contact Form */}
          <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ marginBottom: '20px' }}>Send Us a Message</h3>

            {contactSuccess && (
              <div style={{ backgroundColor: 'var(--color-success-bg)', border: '1px solid var(--color-success)', color: 'var(--color-success)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icons.CheckCircle2 size={18} />
                <span>Thank you! Your message has been sent successfully. We will reply shortly.</span>
              </div>
            )}

            <form onSubmit={handleContactSubmit} className="flex flex-col gap-3">
              <div className="input-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Your Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="John Doe"
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', marginTop: '4px' }}
                />
              </div>

              <div className="input-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="john@example.com"
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', marginTop: '4px' }}
                />
              </div>

              <div className="input-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Subject</label>
                <input 
                  type="text" 
                  required
                  placeholder="Booking Inquiry"
                  value={contactSubject}
                  onChange={e => setContactSubject(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', marginTop: '4px' }}
                />
              </div>

              <div className="input-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Message</label>
                <textarea 
                  rows="4"
                  required
                  placeholder="Tell us about your trip or questions..."
                  value={contactMessage}
                  onChange={e => setContactMessage(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', marginTop: '4px', resize: 'vertical' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                <Icons.Send size={16} /> Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 10. FOOTER */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <footer id="footer" className="glass" style={{ marginTop: '80px', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', padding: '56px 32px 32px 32px', borderBottom: 'none' }}>
        <div className="grid grid-cols-4 gap-4" style={{ marginBottom: '40px' }}>
          <div>
            <div className="flex align-center gap-2" style={{ marginBottom: '16px' }}>
              <span style={{ color: 'var(--color-primary)' }}>
                {renderIcon(settings.logoIcon || 'Home', 24)}
              </span>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{settings.logoText || 'HavenShare'}</h3>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              A premium, Airbnb-inspired vacation rental & property management system built for extraordinary stay experiences worldwide.
            </p>
          </div>

          <div>
            <h4 style={{ marginBottom: '16px', fontSize: '1.05rem' }}>Quick Links</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              <li style={{ cursor: 'pointer' }} onClick={() => scrollToSection('hero')}>Home</li>
              <li style={{ cursor: 'pointer' }} onClick={() => scrollToSection('properties')}>Properties Catalog</li>
              <li style={{ cursor: 'pointer' }} onClick={() => scrollToSection('about')}>About Us</li>
              <li style={{ cursor: 'pointer' }} onClick={() => scrollToSection('amenities')}>Amenities</li>
              <li style={{ cursor: 'pointer' }} onClick={() => scrollToSection('faq')}>FAQ</li>
              <li style={{ cursor: 'pointer' }} onClick={() => scrollToSection('contact')}>Contact Us</li>
            </ul>
          </div>

          <div>
            <h4 style={{ marginBottom: '16px', fontSize: '1.05rem' }}>Direct Contacts</h4>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p>📍 Malibu, California, USA</p>
              <p>📞 {settings.contactPhone || '+1 (800) 555-0199'}</p>
              <p>✉️ {settings.contactEmail || 'support@havenshare.com'}</p>
            </div>
          </div>

          <div>
            <h4 style={{ marginBottom: '16px', fontSize: '1.05rem' }}>Social Media & Portal</h4>
            <div className="flex gap-2" style={{ marginBottom: '16px' }}>
              <a href="#" className="btn-icon" title="Facebook"><Icons.Share2 size={18} /></a>
              <a href="#" className="btn-icon" title="Instagram"><Icons.Camera size={18} /></a>
              <a href="#" className="btn-icon" title="Twitter"><Icons.MessageSquare size={18} /></a>
              <a href="#" className="btn-icon" title="LinkedIn"><Icons.Globe size={18} /></a>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => onNavigate('login', '/login')} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                Portal Sign In
              </button>
            </div>
          </div>
        </div>

        <div className="flex align-center justify-between wrap gap-2" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px', fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
          <div>
            © {new Date().getFullYear()} {settings.logoText || 'HavenShare'}. All rights reserved. Built with precision and care.
          </div>

          <div className="flex gap-3">
            <span style={{ cursor: 'pointer' }}>Privacy Policy</span>
            <span>•</span>
            <span style={{ cursor: 'pointer' }}>Terms & Conditions</span>
            <span>•</span>
            <span style={{ cursor: 'pointer' }}>Cookie Settings</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
