import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme.js';

const SIZES = {
  small: { height: 22, fontSize: 12, notch: 8, dash: 3, dashes: 3, paddingLeft: 9, paddingRight: 10, gap: 7, radius: 6 },
  large: { height: 52, fontSize: 26, notch: 16, dash: 5, dashes: 5, paddingLeft: 20, paddingRight: 22, gap: 14, radius: 10 },
};

// El ticket verde del logo: "AI", una línea punteada y dos recortes a los costados.
// background es el color de lo que hay detrás, para que los recortes se vean huecos.
export function Logo({ size = 'small', background = colors.background }) {
  const s = SIZES[size];
  const notch = { width: s.notch, height: s.notch, borderRadius: s.notch / 2, top: (s.height - s.notch) / 2, backgroundColor: background };

  return (
    <View style={[styles.ticket, { height: s.height, borderRadius: s.radius, paddingLeft: s.paddingLeft, paddingRight: s.paddingRight, gap: s.gap }]}>
      <Text style={[styles.ai, { fontSize: s.fontSize }]}>AI</Text>
      <View style={{ gap: s.dash }}>
        {Array.from({ length: s.dashes }, (_, i) => (
          <View key={i} style={[styles.dash, { height: s.dash }]} />
        ))}
      </View>
      <View style={[styles.notch, notch, { left: -s.notch / 2 }]} />
      <View style={[styles.notch, notch, { right: -s.notch / 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  ticket: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.brand,
  },
  ai: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  dash: {
    width: 2,
    backgroundColor: '#FFFFFF',
  },
  notch: {
    position: 'absolute',
  },
});
