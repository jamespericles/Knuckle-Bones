import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  box: {
    flex: 1,
  },
  innerBox: {
    borderWidth: 1,
    height: 50,
  },
  numbersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  number: {
    textAlign: 'center',
    width: '30%',
  },
});

export default styles;
