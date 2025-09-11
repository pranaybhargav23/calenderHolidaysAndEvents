// src/screens/EventList.jsx
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import GoogleCalendarService from '../services/GoogleCalendarService';
import EventModal from '../components/EventModal';

const EventList = ({ navigation, route }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);
  
  // Get the selected date from navigation params
  const selectedDate = route?.params?.selectedDate;

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const startDate = selectedDate ? new Date(selectedDate) : new Date();
      const endDate = selectedDate ? new Date(selectedDate) : new Date();
      endDate.setDate(endDate.getDate() + 1); // Get events for the whole day

      const userEvents = await GoogleCalendarService.getEvents(
        startDate.toISOString(),
        endDate.toISOString()
      );

      const processedEvents = userEvents
        .map(event => GoogleCalendarService.formatEventForDisplay(event))
        .filter(event => !event.creator.includes('holiday')) // Exclude holidays
        .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));

      setEvents(processedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      Alert.alert('Error', 'Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const handleEditEvent = (event) => {
    setEventToEdit(event);
    setShowEventModal(true);
  };

  const handleAddEvent = () => {
    setEventToEdit(null);
    setShowEventModal(true);
  };

  const handleEventSaved = () => {
    loadEvents();
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

  const formatEventDate = (dateTime) => {
    const date = new Date(dateTime);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderEventItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.eventItem}
      onPress={() => handleEditEvent(item)}
    >
      <View style={styles.eventIndicator} />
      <View style={styles.eventContent}>
        <View style={styles.eventHeader}>
          <Text style={styles.eventTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditEvent(item)}
          >
            <MaterialIcons name="edit" size={18} color="#A16A4D" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.eventDetails}>
          <View style={styles.timeContainer}>
            <MaterialIcons name="access-time" size={16} color="#666" />
            <Text style={styles.eventTime}>
              {formatEventTime(item.startDateTime, item.endDateTime, item.isAllDay)}
            </Text>
          </View>
          
          {!selectedDate && (
            <View style={styles.dateContainer}>
              <MaterialIcons name="event" size={16} color="#666" />
              <Text style={styles.eventDate}>
                {formatEventDate(item.startDateTime)}
              </Text>
            </View>
          )}
        </View>
        
        {item.location && (
          <View style={styles.locationContainer}>
            <MaterialIcons name="location-on" size={16} color="#666" />
            <Text style={styles.eventLocation} numberOfLines={1}>
              {item.location}
            </Text>
          </View>
        )}
        
        {item.description && (
          <Text style={styles.eventDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="event-available" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>No Events Found</Text>
      <Text style={styles.emptySubtitle}>
        {selectedDate 
          ? `No events scheduled for ${formatEventDate(selectedDate)}`
          : 'You have no upcoming events'
        }
      </Text>
      <TouchableOpacity style={styles.addEventButton} onPress={handleAddEvent}>
        <MaterialIcons name="add" size={20} color="#fff" />
        <Text style={styles.addEventText}>Add Event</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#1B1024" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Events</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A16A4D" />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#1B1024" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {selectedDate ? formatEventDate(selectedDate) : 'All Events'}
        </Text>
        <TouchableOpacity onPress={handleAddEvent}>
          <MaterialIcons name="add" size={24} color="#A16A4D" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={events}
        renderItem={renderEventItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        style={styles.list}
        contentContainerStyle={events.length === 0 ? styles.emptyList : styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />

      {/* Floating Action Button */}
      {events.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleAddEvent}>
          <MaterialIcons name="add" size={28} color="#ffffff" />
        </TouchableOpacity>
      )}

      {/* Event Modal */}
      <EventModal
        visible={showEventModal}
        onClose={() => setShowEventModal(false)}
        selectedDate={selectedDate}
        eventToEdit={eventToEdit}
        onEventSaved={handleEventSaved}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B1024',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 15,
    paddingBottom: 100, // Space for FAB
  },
  emptyList: {
    flex: 1,
  },
  eventItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  eventIndicator: {
    width: 4,
    backgroundColor: '#A16A4D',
    borderRadius: 2,
    marginRight: 15,
  },
  eventContent: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B1024',
    flex: 1,
    marginRight: 10,
  },
  editButton: {
    padding: 5,
  },
  eventDetails: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 15,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  eventDate: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  eventLocation: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
    flex: 1,
  },
  eventDescription: {
    fontSize: 14,
    color: '#888',
    lineHeight: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#bbb',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  addEventButton: {
    backgroundColor: '#A16A4D',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    elevation: 3,
  },
  addEventText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
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

export default EventList;