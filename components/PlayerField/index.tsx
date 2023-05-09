import React from 'react';
import { View, Text } from 'react-native';
import { Flex } from '@react-native-material/core';

import styles from './styles';

interface PlayerFieldProps {
  // add any necessary props here
}

const PlayerField: React.FC<PlayerFieldProps> = props => {
  return (
    <Flex style={styles.container}>
      {[1, 2, 3].map(row => (
        <Flex key={row} style={styles.row}>
          {[1, 2, 3].map(col => (
            <View key={col} style={styles.box}>
              {/* replace this with your box component */}
              <View style={styles.innerBox} />
            </View>
          ))}
        </Flex>
      ))}
      <Flex style={styles.numbersRow}>
        {[1, 2, 3].map(col => (
          <Text key={col} style={styles.number}>
            {col}
          </Text>
        ))}
      </Flex>
    </Flex>
  );
};

export default PlayerField;
