import { StyleSheet, Text, View } from 'react-native';
import { APP_NAME } from '@/config/app';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{APP_NAME}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10160F',
  },
  title: { color: '#EDEAE0', fontSize: 28, fontWeight: '600', letterSpacing: 1 },
});
