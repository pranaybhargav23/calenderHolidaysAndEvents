// src/components/EventModal.jsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import GoogleCalendarService from '../services/GoogleCalendarService';

const EventModal = ({ visible, onClose, selectedDate, eventToEdit = null, onEventSaved }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      if (eventToEdit) {
        // Editing existing event
        setTitle(eventToEdit.title || '');
        setDescription(eventToEdit.description || '');
        setLocation(eventToEdit.location || '');
        setDate(new Date(eventToEdit.startDateTime));
        setStartTime(new Date(eventToEdit.startDateTime));
        setEndTime(new Date(eventToEdit.endDateTime));
      } else {
        // Creating new event
        const initialDate = selectedDate ? new Date(selectedDate) : new Date();
        setTitle('');
        setDescription('');
        setLocation('');
        setDate(initialDate);
        
        const startDateTime = new Date(initialDate);
        startDateTime.setHours(9, 0, 0, 0); // Default to 9 AM
        setStartTime(startDateTime);
        
        const endDateTime = new Date(initialDate);
        endDateTime.setHours(10, 0, 0, 0); // Default to 10 AM
        setEndTime(endDateTime);
      }
    }
  }, [visible, eventToEdit, selectedDate]);

  const formatDateTime = (date, time) => {
    const combinedDate = new Date(date);
    combinedDate.setHours(time.getHours(), time.getMinutes(), 0, 0);
    return combinedDate.toISOString();
  };

  const formatDisplayTime = (time) => {
    return time.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDisplayDate = (date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }

    if (endTime <= startTime) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }

    setIsLoading(true);
    try {
      const eventData = {
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        startDateTime: formatDateTime(date, startTime),
        endDateTime: formatDateTime(date, endTime),
      };

      if (eventToEdit) {
        await GoogleCalendarService.updateEvent(eventToEdit.id, eventData);
        Alert.alert('Success', 'Event updated successfully!');
      } else {
        await GoogleCalendarService.createEvent(eventData);
        Alert.alert('Success', 'Event created successfully!');
      }

      onEventSaved?.();
      handleClose();
    } catch (error) {
      console.error('Error saving event:', error);
      Alert.alert('Error', 'Failed to save event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!eventToEdit) return;

    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await GoogleCalendarService.deleteEvent(eventToEdit.id);
              Alert.alert('Success', 'Event deleted successfully!');
              onEventSaved?.();
              handleClose();
            } catch (error) {
              console.error('Error deleting event:', error);
              Alert.alert('Error', 'Failed to delete event. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setLocation('');
    setShowDatePicker(false);
    setShowStartTimePicker(false);
    setShowEndTimePicker(false);
    onClose();
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const onStartTimeChange = (event, selectedTime) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      setStartTime(selectedTime);
    }
  };

  const onEndTimeChange = (event, selectedTime) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      setEndTime(selectedTime);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {eventToEdit ? 'Edit Event' : 'Create Event'}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Title Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter event title"
                placeholderTextColor="#999"
              />
            </View>

            {/* Date Picker */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <MaterialIcons name="event" size={20} color="#A16A4D" />
                <Text style={styles.pickerText}>{formatDisplayDate(date)}</Text>
              </TouchableOpacity>
            </View>

            {/* Time Pickers */}
            <View style={styles.timeContainer}>
              <View style={styles.timeInputContainer}>
                <Text style={styles.label}>Start Time</Text>
                <TouchableOpacity
                  style={styles.timePickerButton}
                  onPress={() => setShowStartTimePicker(true)}
                >
                  <MaterialIcons name="access-time" size={20} color="#A16A4D" />
                  <Text style={styles.pickerText}>{formatDisplayTime(startTime)}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.timeInputContainer}>
                <Text style={styles.label}>End Time</Text>
                <TouchableOpacity
                  style={styles.timePickerButton}
                  onPress={() => setShowEndTimePicker(true)}
                >
                  <MaterialIcons name="access-time" size={20} color="#A16A4D" />
                  <Text style={styles.pickerText}>{formatDisplayTime(endTime)}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Location Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.textInput}
                value={location}
                onChangeText={setLocation}
                placeholder="Enter location"
                placeholderTextColor="#999"
              />
            </View>

            {/* Description Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter description"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {eventToEdit && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
                disabled={isLoading}
              >
                <MaterialIcons name="delete" size={20} color="#fff" />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.saveButton, { flex: eventToEdit ? 2 : 1 }]}
              onPress={handleSave}
              disabled={isLoading}
            >
              <MaterialIcons name="save" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>
                {isLoading ? 'Saving...' : 'Save Event'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Date/Time Pickers */}
          {showDatePicker && (
            <DatePicker
              modal
              open={showDatePicker}
              date={date}
              mode="date"
              theme="dark"
              title="Select date"
              confirmText="Confirm"
              cancelText="Cancel"
              onConfirm={(selectedDate) => {
                onDateChange(null, selectedDate);
                setShowDatePicker(false);
              }}
              onCancel={() => setShowDatePicker(false)}
            />
          )}

          {showStartTimePicker && (
            <DatePicker
              modal
              open={showStartTimePicker}
              date={startTime}
              mode="time"
              theme="dark"
              title="Select start time"
              confirmText="Confirm"
              cancelText="Cancel"
              onConfirm={(selectedTime) => {
                onStartTimeChange(null, selectedTime);
                setShowStartTimePicker(false);
              }}
              onCancel={() => setShowStartTimePicker(false)}
            />
          )}

          {showEndTimePicker && (
            <DatePicker
              modal
              open={showEndTimePicker}
              date={endTime}
              mode="time"
              theme="dark"
              title="Select end time"
              confirmText="Confirm"
              cancelText="Cancel"
              onConfirm={(selectedTime) => {
                onEndTimeChange(null, selectedTime);
                setShowEndTimePicker(false);
              }}
              onCancel={() => setShowEndTimePicker(false)}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 5, 24, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#1B1024',
    borderRadius: 15,
    width: '90%',
    maxHeight: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#3B373E',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    padding: 5,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#3B373E',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#ffffff',
    backgroundColor: '#0F0518',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#3B373E',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#0F0518',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  timeInputContainer: {
    flex: 1,
    marginHorizontal: 5,
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#3B373E',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#0F0518',
  },
  pickerText: {
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 8,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#3B373E',
    gap: 10,
  },
  saveButton: {
    backgroundColor: '#A16A4D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
    elevation: 2,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    elevation: 2,
    flex: 1,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});

export default EventModal;