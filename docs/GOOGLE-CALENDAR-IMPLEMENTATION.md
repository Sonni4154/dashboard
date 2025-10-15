# Google Calendar Team Dashboard - Implementation Guide

## 🎯 Overview

This document provides a complete implementation plan for the Google Calendar integration with the Team Dashboard, Work Queue, and task management system for Marin Pest Control.

---

## 📋 Feature Requirements

### 1. Team Dashboard (Home Page for Non-Admin Users)
**Purpose:** Display all company Google Calendars in a unified week view

**Features:**
- Display 7 AM - 8 PM time slots
- Show multiple calendars side-by-side
- Week navigation (previous/next week)
- Two-way sync with Google Calendar
- Color-coded calendars
- Click to view event details
- Drag-and-drop to assign technicians
- Real-time updates

### 2. Work Queue
**Purpose:** Show technicians their assigned tasks

**Features:**
- List of assigned events/jobs
- Add notes to events
- Edit own notes
- Note format: `MM/DD/YY:Technician:Firstname-Lastname: [Employee Note Here]`
- Multiple notes per event
- Persist to Google Calendar event body

### 3. My Work Today Page
**Purpose:** Detailed view of today's assignments

**Features:**
- Customer information (Name, Address, Phone, Email)
- Service-specific task checklists
- Checkbox completion tracking with timestamps
- Conditional logic (red/green status)
- Payment collection tracking
- Job closure/completion
- Auto-advance to next job

---

## 🗂️ Google Calendar Configuration

### Calendar Structure

| Calendar Name | ID | Type | Billable |
|--------------|-----|------|----------|
| Insect Control / Sprays | `57d4687457176ca4e4b211910e7a69c19369d08081871d9f8ab54d234114c991@group.calendar.google.com` | Service | Yes |
| Rodent Control | `3fc1d11fe5330c3e1c4693570419393a1d74036ef1b4cb866dd337f8c8cc6c8e@group.calendar.google.com` | Service | Yes |
| Termites | `64a3c24910c43703e539ab1e9ac41df6591995c63c1e4f208f76575a50149610@group.calendar.google.com` | Service | Yes |
| Trap Check | `529c43e689235b82258319c30e7449e97c8788cb01cd924e0f4d0b4c34305cdb@group.calendar.google.com` | Service | No |
| Inspections | `c81f827b8eeec1453d1f3d90c7bca859a1d342953680c4a0448e6b0b96b8bb4a@group.calendar.google.com` | Service | Yes |
| Tradework | `97180df5c9275973f1c51e234ec36de62c401860313b0b734704f070e5acf411@group.calendar.google.com` | Service | Yes |
| Integrations | `spencermreiser@gmail.com` | Admin | N/A |
| Employee Notes | `marinpestcontrol@gmail.com` | Internal | N/A |

### User Permissions

| Email | Role | Permissions |
|-------|------|-------------|
| marinpestcontrol@gmail.com | Admin | RWD (Read, Write, Delete) - All calendars |
| spencermreiser@gmail.com | Admin | RWD - All calendars |
| nico.kitten.woods@gmail.com | Technician | R - Most calendars, RWD - Some |
| yngtwinkie17@gmail.com | Technician | RWD - Most calendars |
| bodenhaines5@gmail.com | Technician | RWD - Most calendars |

---

## 📊 Database Schema Updates

### Task Checklists Table
```sql
CREATE TABLE IF NOT EXISTS google.task_checklists (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(255) NOT NULL,
    calendar_id VARCHAR(255) NOT NULL,
    checklist_type VARCHAR(50) NOT NULL, -- 'insect_control', 'rodent', 'termite', etc.
    completed_by INTEGER REFERENCES users(id),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, calendar_id)
);

CREATE TABLE IF NOT EXISTS google.task_checklist_items (
    id SERIAL PRIMARY KEY,
    checklist_id INTEGER REFERENCES google.task_checklists(id) ON DELETE CASCADE,
    item_number INTEGER NOT NULL,
    item_text TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    notes TEXT,
    payment_amount DECIMAL(10,2),
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS google.event_notes (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(255) NOT NULL,
    calendar_id VARCHAR(255) NOT NULL,
    user_id INTEGER REFERENCES users(id),
    note_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_task_checklists_event ON google.task_checklists(event_id);
CREATE INDEX IF NOT EXISTS idx_task_checklist_items_checklist ON google.task_checklist_items(checklist_id);
CREATE INDEX IF NOT EXISTS idx_event_notes_event ON google.event_notes(event_id);
```

---

## 🔌 Backend Implementation

### Phase 1: Google Calendar API Integration

#### 1.1 Install Dependencies
```bash
npm install googleapis @google-cloud/calendar
```

#### 1.2 Google OAuth Service (`backend/src/services/googleAuthService.ts`)
```typescript
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

export class GoogleAuthService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'
    });
  }

  async getTokenFromCode(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    return tokens;
  }

  setCredentials(tokens: any) {
    this.oauth2Client.setCredentials(tokens);
  }

  getClient(): OAuth2Client {
    return this.oauth2Client;
  }
}
```

#### 1.3 Google Calendar Service (`backend/src/services/googleCalendarService.ts`)
```typescript
import { google, calendar_v3 } from 'googleapis';
import { GoogleAuthService } from './googleAuthService.js';
import { logger } from '../utils/logger.js';

export class GoogleCalendarService {
  private calendar: calendar_v3.Calendar;
  private authService: GoogleAuthService;

  constructor() {
    this.authService = new GoogleAuthService();
    // Load stored credentials
    // this.initializeWithStoredCredentials();
  }

  async getEvents(calendarId: string, timeMin: Date, timeMax: Date) {
    try {
      const auth = this.authService.getClient();
      const calendar = google.calendar({ version: 'v3', auth });

      const response = await calendar.events.list({
        calendarId,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.data.items || [];
    } catch (error) {
      logger.error(`Error fetching events from calendar ${calendarId}:`, error);
      throw error;
    }
  }

  async createEvent(calendarId: string, event: calendar_v3.Schema$Event) {
    try {
      const auth = this.authService.getClient();
      const calendar = google.calendar({ version: 'v3', auth });

      const response = await calendar.events.insert({
        calendarId,
        requestBody: event
      });

      return response.data;
    } catch (error) {
      logger.error(`Error creating event in calendar ${calendarId}:`, error);
      throw error;
    }
  }

  async updateEvent(calendarId: string, eventId: string, event: calendar_v3.Schema$Event) {
    try {
      const auth = this.authService.getClient();
      const calendar = google.calendar({ version: 'v3', auth });

      const response = await calendar.events.update({
        calendarId,
        eventId,
        requestBody: event
      });

      return response.data;
    } catch (error) {
      logger.error(`Error updating event ${eventId} in calendar ${calendarId}:`, error);
      throw error;
    }
  }

  async deleteEvent(calendarId: string, eventId: string) {
    try {
      const auth = this.authService.getClient();
      const calendar = google.calendar({ version: 'v3', auth });

      await calendar.events.delete({
        calendarId,
        eventId
      });

      return true;
    } catch (error) {
      logger.error(`Error deleting event ${eventId} from calendar ${calendarId}:`, error);
      throw error;
    }
  }

  async addNoteToEvent(calendarId: string, eventId: string, note: string, userName: string) {
    try {
      // Get current event
      const auth = this.authService.getClient();
      const calendar = google.calendar({ version: 'v3', auth });
      
      const event = await calendar.events.get({
        calendarId,
        eventId
      });

      // Format note
      const date = new Date().toLocaleDateString('en-US');
      const formattedNote = `${date}:Technician:${userName}: ${note}`;
      
      // Append to description
      const currentDescription = event.data.description || '';
      const updatedDescription = currentDescription 
        ? `${currentDescription}\n${formattedNote}`
        : formattedNote;

      // Update event
      const updatedEvent = await this.updateEvent(calendarId, eventId, {
        ...event.data,
        description: updatedDescription
      });

      return updatedEvent;
    } catch (error) {
      logger.error(`Error adding note to event ${eventId}:`, error);
      throw error;
    }
  }

  async assignEventToTechnician(calendarId: string, eventId: string, technicianEmail: string, technicianName: string) {
    try {
      const auth = this.authService.getClient();
      const calendar = google.calendar({ version: 'v3', auth });
      
      const event = await calendar.events.get({
        calendarId,
        eventId
      });

      // Update attendees
      const attendees = event.data.attendees || [];
      attendees.push({
        email: technicianEmail,
        displayName: technicianName,
        responseStatus: 'accepted'
      });

      const updatedEvent = await this.updateEvent(calendarId, eventId, {
        ...event.data,
        attendees
      });

      return updatedEvent;
    } catch (error) {
      logger.error(`Error assigning event ${eventId} to technician:`, error);
      throw error;
    }
  }
}
```

### Phase 2: API Endpoints

#### 2.1 Google OAuth Routes (`backend/src/routes/google-oauth.ts`)
```typescript
import { Router } from 'express';
import { GoogleAuthService } from '../services/googleAuthService.js';

const router = Router();
const authService = new GoogleAuthService();

// Initiate OAuth flow
router.get('/connect', (req, res) => {
  const authUrl = authService.getAuthUrl();
  res.redirect(authUrl);
});

// OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const tokens = await authService.getTokenFromCode(code as string);
    
    // Store tokens in database
    // await storeGoogleTokens(tokens);
    
    res.redirect('/dashboard?google_auth=success');
  } catch (error) {
    res.redirect('/dashboard?google_auth=error');
  }
});

export default router;
```

#### 2.2 Calendar Events Routes (`backend/src/routes/calendar-events.ts`)
```typescript
import { Router } from 'express';
import { GoogleCalendarService } from '../services/googleCalendarService.js';
import { verifyCustomAuth } from '../middleware/customAuth.js';

const router = Router();
const calendarService = new GoogleCalendarService();

// Apply auth to all routes
router.use(verifyCustomAuth);

// Get events for all calendars (Team Dashboard)
router.get('/all', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const calendarIds = [
      process.env.GOOGLE_CALENDAR_INSECT_CONTROL,
      process.env.GOOGLE_CALENDAR_RODENT_CONTROL,
      process.env.GOOGLE_CALENDAR_TERMITES,
      process.env.GOOGLE_CALENDAR_TRAP_CHECK,
      process.env.GOOGLE_CALENDAR_INSPECTIONS,
      process.env.GOOGLE_CALENDAR_TRADEWORK
    ].filter(Boolean);

    const allEvents = await Promise.all(
      calendarIds.map(id => 
        calendarService.getEvents(
          id!,
          new Date(startDate as string),
          new Date(endDate as string)
        )
      )
    );

    // Combine and format events
    const events = allEvents.flat().map((event, index) => ({
      ...event,
      calendarId: calendarIds[Math.floor(index / allEvents[0].length)]
    }));

    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch events' });
  }
});

// Get events for specific calendar
router.get('/:calendarId', async (req, res) => {
  try {
    const { calendarId } = req.params;
    const { startDate, endDate } = req.query;

    const events = await calendarService.getEvents(
      calendarId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch events' });
  }
});

// Create event
router.post('/', async (req, res) => {
  try {
    const { calendarId, event } = req.body;
    const createdEvent = await calendarService.createEvent(calendarId, event);
    res.json({ success: true, data: createdEvent });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create event' });
  }
});

// Update event
router.put('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { calendarId, event } = req.body;
    
    const updatedEvent = await calendarService.updateEvent(calendarId, eventId, event);
    res.json({ success: true, data: updatedEvent });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update event' });
  }
});

// Delete event
router.delete('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { calendarId } = req.query;
    
    await calendarService.deleteEvent(calendarId as string, eventId);
    res.json({ success: true, message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete event' });
  }
});

// Add note to event
router.post('/:eventId/notes', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { calendarId, note } = req.body;
    const userName = `${req.user!.firstName} ${req.user!.lastName}`;
    
    const updatedEvent = await calendarService.addNoteToEvent(
      calendarId,
      eventId,
      note,
      userName
    );
    
    res.json({ success: true, data: updatedEvent });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add note' });
  }
});

// Assign event to technician
router.post('/:eventId/assign', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { calendarId, technicianEmail, technicianName } = req.body;
    
    const updatedEvent = await calendarService.assignEventToTechnician(
      calendarId,
      eventId,
      technicianEmail,
      technicianName
    );
    
    res.json({ success: true, data: updatedEvent });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to assign event' });
  }
});

// Get my assigned events (Work Queue)
router.get('/my/assigned', async (req, res) => {
  try {
    const userEmail = req.user!.email;
    const { startDate, endDate } = req.query;
    
    // Fetch all events and filter by attendee
    const calendarIds = [
      process.env.GOOGLE_CALENDAR_INSECT_CONTROL,
      process.env.GOOGLE_CALENDAR_RODENT_CONTROL,
      process.env.GOOGLE_CALENDAR_TERMITES,
      process.env.GOOGLE_CALENDAR_TRAP_CHECK,
      process.env.GOOGLE_CALENDAR_INSPECTIONS,
      process.env.GOOGLE_CALENDAR_TRADEWORK
    ].filter(Boolean);

    const allEvents = await Promise.all(
      calendarIds.map(id => 
        calendarService.getEvents(
          id!,
          new Date(startDate as string),
          new Date(endDate as string)
        )
      )
    );

    // Filter events where user is an attendee
    const myEvents = allEvents.flat().filter(event => 
      event.attendees?.some(attendee => attendee.email === userEmail)
    );

    res.json({ success: true, data: myEvents });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch assigned events' });
  }
});

export default router;
```

---

## 🎨 Frontend Implementation

### Phase 3: Team Dashboard Component

#### 3.1 Calendar View Component (`frontend/src/pages/team-dashboard.tsx`)

```typescript
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';

export default function TeamDashboard() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

  const { data: events, isLoading } = useQuery({
    queryKey: ['calendar-events', weekStart, weekEnd],
    queryFn: () => api.get(`/calendar-events/all?startDate=${weekStart.toISOString()}&endDate=${weekEnd.toISOString()}`)
  });

  const goToPreviousWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const goToNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const goToCurrentWeek = () => setCurrentWeek(new Date());

  // ... Calendar grid rendering logic
  
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Team Dashboard</h1>
        <div className="flex items-center gap-4">
          <button onClick={goToPreviousWeek}>
            <ChevronLeft />
          </button>
          <button onClick={goToCurrentWeek}>
            Today
          </button>
          <button onClick={goToNextWeek}>
            <ChevronRight />
          </button>
        </div>
      </div>
      
      {/* Calendar Grid */}
      {/* Work Queue */}
    </div>
  );
}
```

---

## 📝 Implementation Timeline

### Week 1: Backend Setup
- [ ] Install googleapis package
- [ ] Create Google OAuth service
- [ ] Create Google Calendar service  
- [ ] Set up OAuth routes
- [ ] Set up calendar events routes
- [ ] Test API endpoints

### Week 2: Database & Task System
- [ ] Run database migrations for task checklists
- [ ] Create task checklist API endpoints
- [ ] Implement note system
- [ ] Test event notes sync

### Week 3: Frontend - Team Dashboard
- [ ] Create Team Dashboard page
- [ ] Build calendar week view
- [ ] Implement event drag-and-drop
- [ ] Add event detail modal
- [ ] Test two-way sync

### Week 4: Frontend - My Work Today
- [ ] Create My Work Today page
- [ ] Build task checklist component
- [ ] Implement conditional logic
- [ ] Add payment tracking
- [ ] Test job completion flow

### Week 5: Polish & Testing
- [ ] Add real-time updates (websockets?)
- [ ] Optimize performance
- [ ] Add error handling
- [ ] User acceptance testing
- [ ] Deploy to production

---

*This is a comprehensive implementation guide. Let me know when you're ready to start, and we can tackle it phase by phase!*
