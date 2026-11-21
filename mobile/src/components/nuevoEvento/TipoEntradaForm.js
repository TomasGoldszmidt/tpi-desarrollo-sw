import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Boton } from '../Boton.js';
import { colors, fontSize, spacing } from '../../theme.js';
import { estilosFormulario } from './estilos.js';
import { LARGOS } from './largos.js';

// Un tipo de entrada del formulario. onQuitar es null en el primero: siempre queda uno.
export function TipoEntradaForm({ numero, tipo, errores, onChange, onQuitar }) {
  const conError = Object.values(errores).some(Boolean);
  return (
    <View style={[styles.tipo, conError && styles.tipoConError]}>
      <View style={styles.tipoArriba}>
        <Text style={styles.tipoNumero}>Tipo {numero}</Text>
        {onQuitar ? <Boton titulo="Quitar" variante="peligro" chico onPress={onQuitar} accessibilityLabel={`Quitar el tipo ${numero}`} /> : null}
      </View>
      <Text style={estilosFormulario.etiqueta}>Nombre</Text>
      <TextInput
        style={[estilosFormulario.input, errores.nombre && estilosFormulario.inputError]}
        value={tipo.nombre}
        onChangeText={(valor) => onChange('nombre', valor)}
        maxLength={LARGOS.tipoNombre}
        placeholder="Ej: General"
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={`Nombre del tipo ${numero}`}
      />
      {errores.nombre ? <Text style={estilosFormulario.error}>{errores.nombre}</Text> : null}
      <Text style={[estilosFormulario.etiqueta, styles.separado]}>Descripción</Text>
      <TextInput
        style={[estilosFormulario.input, errores.descripcion && estilosFormulario.inputError]}
        value={tipo.descripcion}
        onChangeText={(valor) => onChange('descripcion', valor)}
        maxLength={LARGOS.tipoDescripcion}
        placeholder="Ej: Sin ubicación asignada"
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={`Descripción del tipo ${numero}`}
      />
      {errores.descripcion ? <Text style={estilosFormulario.error}>{errores.descripcion}</Text> : null}
      <View style={[estilosFormulario.fila, styles.separado]}>
        <View style={estilosFormulario.columna}>
          <Text style={estilosFormulario.etiqueta}>Precio</Text>
          <View style={[estilosFormulario.input, styles.conPrefijo, errores.precio && estilosFormulario.inputError]}>
            <Text style={estilosFormulario.valor}>$ </Text>
            <TextInput
              style={styles.inputPelado}
              value={tipo.precio}
              onChangeText={(valor) => onChange('precio', valor.replace(/[^\d,]/g, ''))}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel={`Precio del tipo ${numero}`}
            />
          </View>
          {errores.precio ? <Text style={estilosFormulario.error}>{errores.precio}</Text> : null}
        </View>
        <View style={estilosFormulario.columna}>
          <Text style={estilosFormulario.etiqueta}>Cupo</Text>
          <TextInput
            style={[estilosFormulario.input, errores.cupo && estilosFormulario.inputError]}
            value={tipo.cupo}
            onChangeText={(valor) => onChange('cupo', valor.replace(/\D/g, ''))}
            keyboardType="number-pad"
            placeholder="100"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel={`Cupo del tipo ${numero}`}
          />
          {errores.cupo ? <Text style={estilosFormulario.error}>{errores.cupo}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  conPrefijo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 0,
  },
  inputPelado: {
    flex: 1,
    paddingVertical: spacing.sm,
    fontSize: fontSize.body,
    color: colors.text,
  },
  tipo: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 14,
    padding: spacing.md + 2,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  tipoConError: {
    borderColor: colors.danger,
  },
  tipoArriba: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 40,
    marginBottom: spacing.xs,
  },
  tipoNumero: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  separado: {
    marginTop: spacing.md,
  },
});
