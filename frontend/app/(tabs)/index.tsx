
import { StyleSheet, View, Text } from 'react-native';


export default function HomeScreen() {
  return (
   <View style={styles.mainContainer}>
      <Text style={styles.text}>Hello world</Text>
   </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color:'red'
  },
});
