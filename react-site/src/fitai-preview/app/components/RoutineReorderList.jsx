import { View, Text } from 'react-native';

export default function RoutineReorderList({ routines = [] }) {
  return (
    <View style={{ gap: 10 }}>
      {routines.map((routine) => (
        <View
          key={routine.id}
          style={{
            padding: 14,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.06)',
            backgroundColor: 'rgba(255,255,255,0.03)',
          }}
        >
          <Text style={{ color: '#f8fafc', fontFamily: 'SpaceGrotesk_700Bold', fontSize: 14 }}>
            {routine.name}
          </Text>
        </View>
      ))}
    </View>
  );
}
