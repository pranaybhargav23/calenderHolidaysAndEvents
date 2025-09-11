import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import React,{useState} from 'react';
import Header from '../components/Header';
import { Calendar } from 'react-native-calendars';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const HomeScreen = () => {
  const [selected, setSelected] = useState('');

  const handleAddEvent = () => {
    console.log('Add new event clicked');
    // You can add navigation to add event screen here
    // navigation.navigate('AddEvent');
  };

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.calendarContainer}>
        <Calendar
          onDayPress={day => {
            setSelected(day.dateString);
          }}
          markedDates={{
            [selected]: {
              selected: true,
              disableTouchEvent: true,
              selectedColor: '#2196F3',
              selectedTextColor: 'white',
            },
          }}
          theme={{
            backgroundColor: '#ffffff',
            calendarBackground: '#ffffff',
            textSectionTitleColor: '#333333',
            selectedDayBackgroundColor: '#2196F3',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#2196F3',
            dayTextColor: '#333333',
            textDisabledColor: '#999999',
            dotColor: '#2196F3',
            selectedDotColor: '#ffffff',
            arrowColor: '#333333',
            disabledArrowColor: '#999999',
            monthTextColor: '#333333',
            indicatorColor: '#2196F3',
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
      
      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAddEvent}>
        <MaterialIcons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  calendarContainer: {
    flex: 0.7, // Takes 70% of the screen
    backgroundColor: '#ffffff',
    paddingHorizontal: 15,
    paddingTop: 10,
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  calendar: {
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: '#ffffff',
    paddingBottom: 10,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 25,
    backgroundColor: '#2196F3',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
});
