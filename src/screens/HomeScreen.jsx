// src/screens/HomeScreen.jsx
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Header from '../components/Header';
import EventModal from '../components/EventModal';
import GoogleCalendarService from '../services/GoogleCalendarService';

const HomeScreen = ({ navigation }) => {
  const [selected, setSelected] = useState('');
  const [events, setEvents] = useState({});
  const [markedDates, setMarkedDates] = useState({});
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] = useState('');
  const [eventToEdit, setEventToEdit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);
  const [loadedYears, setLoadedYears] = useState(new Set());

  // Custom Day Component
  const CustomDay = ({ date, marking, onPress }) => {
    const dayEvents = events[date.dateString] || [];
    const isSelected = marking && marking.selected;
    const isToday = date.dateString === new Date().toISOString().split('T')[0];
    
    const handleDayPress = () => {
      if (onPress) {
        onPress(date);
      }
      // Just select the date, don't open modal
      setSelected(date.dateString);
    };
    
    return (
      <TouchableOpacity
        style={[
          styles.dayContainer,
          isSelected && styles.selectedDay,
        ]}
        onPress={handleDayPress}
      >
        <View style={styles.dayContent}>
          <Text style={[
            styles.dayText,
            isSelected && styles.selectedDayText,
            isToday && !isSelected && styles.todayText,
          ]}>
            {date.day}
          </Text>
          
          {/* Events under date */}
          <View style={styles.eventsUnderDate}>
            {dayEvents.slice(0, 3).map((event, index) => {
              const isGoogleEvent = event.creator && event.creator.includes('holiday');
              const isManualEvent = !isGoogleEvent;
              
              return (
                <View
                  key={`${event.id}-${index}`}
                  style={[
                    styles.eventChip,
                    { backgroundColor: isGoogleEvent ? '#4CAF50' : '#2196F3' }
                  ]}
                >
                  <Text style={styles.eventChipText} numberOfLines={1}>
                    {event.title.length > 8 ? event.title.substring(0, 8) + '...' : event.title}
                  </Text>
                </View>
              );
            })}
            {dayEvents.length > 3 && (
              <Text style={styles.moreEventsText}>+{dayEvents.length - 3}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    loadCalendarData();
  }, []);

  useEffect(() => {
    if (selected && events[selected]) {
      setSelectedDateEvents(events[selected]);
    } else {
      setSelectedDateEvents([]);
    }
  }, [selected, events]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const currentYear = new Date().getFullYear();
      
      // Fetch events for the entire current year and next year
      const startDate = new Date(currentYear, 0, 1); // January 1st of current year
      const endDate = new Date(currentYear + 1, 11, 31); // December 31st of next year

      // Fetch user events and holidays
      const [userEvents, holidays] = await Promise.all([
        GoogleCalendarService.getEvents(startDate.toISOString(), endDate.toISOString()),
        GoogleCalendarService.getHolidays(startDate.toISOString(), endDate.toISOString())
      ]);

      // Combine and process events
      const allEvents = [...userEvents, ...holidays];
      const groupedEvents = GoogleCalendarService.groupEventsByDate(allEvents);
      const marked = createMarkedDates(groupedEvents);

      setEvents(groupedEvents);
      setMarkedDates(marked);
      setLoadedYears(new Set([currentYear, currentYear + 1]));
      
      // Set today as selected if no date is selected
      if (!selected) {
        const today = new Date().toISOString().split('T')[0];
        setSelected(today);
      }
    } catch (error) {
      console.error('Error loading calendar data:', error);
      Alert.alert('Error', 'Failed to load calendar data. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const loadAdditionalYear = async (year) => {
    if (loadedYears.has(year)) {
      return; // Already loaded
    }

    try {
      const startDate = new Date(year, 0, 1); // January 1st of the year
      const endDate = new Date(year, 11, 31); // December 31st of the year

      // Fetch user events and holidays for this year
      const [userEvents, holidays] = await Promise.all([
        GoogleCalendarService.getEvents(startDate.toISOString(), endDate.toISOString()),
        GoogleCalendarService.getHolidays(startDate.toISOString(), endDate.toISOString())
      ]);

      // Combine and process events
      const allEvents = [...userEvents, ...holidays];
      const groupedEvents = GoogleCalendarService.groupEventsByDate(allEvents);
      
      // Merge with existing events
      setEvents(prevEvents => ({ ...prevEvents, ...groupedEvents }));
      
      // Update marked dates
      const newMarked = createMarkedDates({ ...events, ...groupedEvents });
      setMarkedDates(newMarked);
      
      // Mark this year as loaded
      setLoadedYears(prev => new Set([...prev, year]));
    } catch (error) {
      console.error(`Error loading data for year ${year}:`, error);
    }
  };

  const onMonthChange = (month) => {
    const year = new Date(month.dateString).getFullYear();
    
    // Load events for this year if not already loaded
    if (!loadedYears.has(year)) {
      loadAdditionalYear(year);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCalendarData();
    setRefreshing(false);
  };

  const createMarkedDates = (eventsData) => {
    const marked = {};
    
    Object.keys(eventsData).forEach(date => {
      marked[date] = {
        marked: true,
      };
    });

    // Mark selected date
    if (selected) {
      marked[selected] = {
        ...marked[selected],
        selected: true,
      };
    }

    return marked;
  };

  const handleDayPress = (day) => {
    setSelected(day.dateString);
    const updatedMarked = { ...markedDates };
    
    // Remove selection from previously selected date
    Object.keys(updatedMarked).forEach(date => {
      if (updatedMarked[date].selected) {
        const { selected, ...rest } = updatedMarked[date];
        updatedMarked[date] = rest;
      }
    });
    
    // Add selection to new date
    updatedMarked[day.dateString] = {
      ...updatedMarked[day.dateString],
      selected: true,
    };
    
    setMarkedDates(updatedMarked);
  };

  const handleAddEvent = () => {
    setEventToEdit(null);
    setSelectedDateForModal(selected || new Date().toISOString().split('T')[0]);
    setShowEventModal(true);
  };

  const handleEditEvent = (event) => {
    setEventToEdit(event);
    setShowEventModal(true);
  };

  const handleEventSaved = () => {
    loadCalendarData();
  };

  const formatEventTime = (startDateTime, endDateTime, isAllDay) => {
    if (isAllDay) return 'All day';
    
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    
    const formatTime = (date) => {
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    };
    
    return `${formatTime(start)} - ${formatTime(end)}`;
  };

  const renderEventItem = (event, index) => {
    const isGoogleEvent = event.creator && event.creator.includes('holiday');
    const isManualEvent = !isGoogleEvent;
    
    return (
      <TouchableOpacity
        key={`${event.id}-${index}`}
        style={[
          styles.eventItem,
          { backgroundColor: isGoogleEvent ? '#4CAF50' : '#2196F3' }
        ]}
        onPress={() => !isGoogleEvent && handleEditEvent(event)}
        disabled={isGoogleEvent}
      >
        <View style={styles.eventContent}>
          <View style={styles.eventHeader}>
            <Text style={styles.eventTitle} numberOfLines={1}>
              {event.title}
            </Text>
            <Text style={styles.eventTime}>
              {formatEventTime(event.startDateTime, event.endDateTime, event.isAllDay)}
            </Text>
          </View>
          
          {event.location && (
            <Text style={styles.eventLocation} numberOfLines={1}>
              📍 {event.location}
            </Text>
          )}
          
          {event.description && (
            <Text style={styles.eventDescription} numberOfLines={2}>
              {event.description}
            </Text>
          )}
        </View>
        
        {isManualEvent && (
          <MaterialIcons name="edit" size={20} color="#ffffff" style={styles.editIcon} />
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A16A4D" />
          <Text style={styles.loadingText}>Loading your calendar...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar Section */}
        <View style={styles.calendarContainer}>
          <Calendar
            onDayPress={handleDayPress}
            onMonthChange={onMonthChange}
            markedDates={markedDates}
            dayComponent={CustomDay}
            theme={{
              backgroundColor: '#0F0518',
              calendarBackground: '#0F0518',
              textSectionTitleColor: '#ffffff',
              selectedDayBackgroundColor: '#A16A4D',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#A16A4D',
              dayTextColor: '#ffffff',
              textDisabledColor: '#3B373E',
              dotColor: '#A16A4D',
              selectedDotColor: '#ffffff',
              arrowColor: '#A16A4D',
              disabledArrowColor: '#3B373E',
              monthTextColor: '#ffffff',
              indicatorColor: '#A16A4D',
              textDayFontFamily: 'System',
              textMonthFontFamily: 'System',
              textDayHeaderFontFamily: 'System',
              textDayFontWeight: '400',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14,
            }}
            style={styles.calendar}
            hideExtraDays={false}
            showWeekNumbers={false}
            disableMonthChange={false}
            firstDay={1}
            hideDayNames={false}
            showSixWeeks={false}
          />
        </View>

        {/* Selected Date Events Section */}
        <View style={styles.eventsSection}>
          <View style={styles.eventsSectionHeader}>
            <Text style={styles.eventsSectionTitle}>
              {selected ? 
                `Events for ${new Date(selected).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}` : 
                'Select a date to view events'
              }
            </Text>
            <Text style={styles.eventsCount}>
              {selectedDateEvents.length} {selectedDateEvents.length === 1 ? 'event' : 'events'}
            </Text>
          </View>
          
          {selectedDateEvents.length > 0 ? (
            <View style={styles.eventsContainer}>
              {selectedDateEvents.map(renderEventItem)}
            </View>
          ) : (
            <View style={styles.noEventsContainer}>
              <MaterialIcons name="event-available" size={48} color="#ccc" />
              <Text style={styles.noEventsText}>No events for this date</Text>
              <Text style={styles.noEventsSubText}>Tap + to add an event</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAddEvent}>
        <MaterialIcons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>

      {/* Event Modal */}
      <EventModal
        visible={showEventModal}
        onClose={() => setShowEventModal(false)}
        selectedDate={selectedDateForModal}
        eventToEdit={eventToEdit}
        onEventSaved={handleEventSaved}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0518',
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0518',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#ffffff',
  },
  calendarContainer: {
    backgroundColor: '#1B1024',
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  calendar: {
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: '#1B1024',
  },
  // Custom Day Styles
  dayContainer: {
    width: 40,
    height: 80,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 4,
  },
  selectedDay: {
    backgroundColor: '#A16A4D',
    borderRadius: 8,
  },
  dayContent: {
    alignItems: 'center',
    flex: 1,
  },
  dayText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '400',
  },
  selectedDayText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  todayText: {
    color: '#A16A4D',
    fontWeight: 'bold',
  },
  eventsUnderDate: {
    marginTop: 2,
    alignItems: 'center',
    width: '100%',
  },
  eventChip: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginVertical: 1,
    minHeight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '90%',
  },
  eventChipText: {
    fontSize: 8,
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  moreEventsText: {
    fontSize: 8,
    color: '#666',
    marginTop: 1,
  },
  eventsSection: {
    margin: 15,
    backgroundColor: '#1B1024',
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    marginBottom: 100, // Space for FAB
  },
  eventsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3B373E',
  },
  eventsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  eventsCount: {
    fontSize: 14,
    color: '#ffffff',
    backgroundColor: '#3B373E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventsContainer: {
    padding: 15,
  },
  eventItem: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  eventContent: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    marginRight: 10,
  },
  eventTime: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.9,
  },
  eventLocation: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
    lineHeight: 18,
    marginBottom: 8,
  },
  editIcon: {
    marginLeft: 10,
    opacity: 0.8,
  },
  noEventsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noEventsText: {
    fontSize: 18,
    color: '#3B373E',
    marginTop: 10,
  },
  noEventsSubText: {
    fontSize: 14,
    color: '#3B373E',
    marginTop: 5,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 25,
    backgroundColor: '#A16A4D',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
});

export default HomeScreen;