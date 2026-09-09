import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { I18nRefreshDirective } from '../../../../../shared/directives/i18n-refresh.directive';
import { ScannerFacadeService } from '../../../../scanner/services/scanner-facade.service';
import { IndicadorSalida } from '../../../../scanner/models/indicador-salida.interface';
import { ValorInteger } from '../../../../scanner/models/valor-integer.interface';
import { ValorFloat } from '../../../../scanner/models/valor-float.interface';
import { IntegerParameter } from '../../../../scanner/components/scanner-configuration/card-selected-filters/integer-parameter/integer-parameter';
import { FloatParameter } from '../../../../scanner/components/scanner-configuration/card-selected-filters/float-parameter/float-parameter';
import { PivotsConfig, PivotsPriceReference } from '../../../models/pivots.models';

// Reusa el catalogo de "indicador de salida" Pivots que scanner ya expone
// (mismos parametros, defaults y validacion de rango que
// IndicadorSalidaFactoryPivots.java) en vez de duplicar un formulario
// nuevo -- esta ventana solo lo muestra suelto, sin persistirlo a ningun
// escaner. TIMEFRAME_PIVOTS_SALIDA se filtra de indicador.parametros (ver
// PARAMETROS_VISIBLES): solo existe D1 hoy, un selector de una sola opcion
// no aporta nada. priceReference no viene de este catalogo -- es propio de
// este endpoint de exploracion (ver PivotsConfig).
const ENUM_INDICADOR_PIVOTS = 'PIVOTS';
const PARAM = {
  LONGITUD_VELAS: 'LONGITUD_VELAS_PIVOTS_SALIDA',
  SLIP_RATIO: 'SLIP_RATIO_PIVOTS_SALIDA',
  LONGITUD_ATR: 'LONGITUD_ATR_PIVOTS_SALIDA',
  ANIOS_HISTORICO: 'ANIOS_HISTORICO_PIVOTS_SALIDA',
  NUMERO_PIVOTES: 'NUMERO_PIVOTES_PIVOTS_SALIDA',
} as const;
const PARAMETROS_VISIBLES: string[] = Object.values(PARAM);

// Defaults ORIGINALES de GET /escaner/pivots/{symbol} (ver
// PivotesRestController), NO los del catalogo de indicador de salida --
// difieren en aniosHistorico (4 vs 5) y numeroPivotes (5 vs 1), porque el
// catalogo sirve a un caso de uso distinto (SL/TP de una posicion abierta,
// donde 1 nivel alcanza) y puede evolucionar por separado. Esta ventana es
// la de exploracion del chart: arranca con la config que ya tenia antes de
// existir este dialogo.
const BASE_DEFAULTS: PivotsConfig = {
  atrLength: 14, slipRatioPct: 0.1, longitudVelas: 2, aniosHistorico: 4, numeroPivotes: 5, priceReference: 'live'
};

@Component({
  selector: 'app-pivots-config-dialog',
  imports: [
    MatDialogModule, MatButtonModule, MatButtonToggleModule, MatIconModule, MatProgressSpinnerModule,
    MatTooltipModule, TranslateModule, I18nRefreshDirective, IntegerParameter, FloatParameter
  ],
  templateUrl: './pivots-config-dialog.html',
  styleUrl: './pivots-config-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PivotsConfigDialog implements OnInit {
  readonly dialogRef = inject(MatDialogRef<PivotsConfigDialog>);
  readonly data: { initial?: PivotsConfig; signalPrice?: number } = inject(MAT_DIALOG_DATA, { optional: true }) || {};
  private readonly facade = inject(ScannerFacadeService);

  // Solo hay precio de senal cuando el grafico se abrio DESDE una senal Y
  // esa senal trae precio (hay senales que no lo tienen, ver el comentario
  // de PivotsPriceReference) -- la opcion "precio de la senal" del toggle
  // de abajo no se ofrece en ningun otro caso.
  readonly hasSignalPrice = this.data.signalPrice !== undefined;

  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly indicador = signal<IndicadorSalida | null>(null);
  // Si la ultima config guardada era 'signal' pero esta apertura no trae
  // precio de senal (otro simbolo, o uno abierto sin senal desde Activos),
  // cae a 'live' -- la opcion guardada ya no aplica aca.
  readonly priceReference = signal<PivotsPriceReference>(
    this.data.initial?.priceReference === 'signal' && !this.hasSignalPrice
      ? 'live'
      : this.data.initial?.priceReference ?? 'live'
  );

  ngOnInit(): void {
    this.facade.getIndicadorSalidaPorDefectoSilent(ENUM_INDICADOR_PIVOTS).subscribe({
      next: (indicador) => {
        const conValores = this.conValoresIniciales(indicador, this.data.initial ?? BASE_DEFAULTS);
        this.indicador.set({
          ...conValores,
          parametros: conValores.parametros.filter(p => PARAMETROS_VISIBLES.includes(p.enumParametro))
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      }
    });
  }

  // Pisa los valores del catalogo con los que la persona eligio la vez
  // anterior (ver openPivotsConfig en symbol-chart.component.ts) o, si nunca
  // calculo, con BASE_DEFAULTS -- nunca se muestran los defaults del
  // catalogo tal cual (ver el comentario de BASE_DEFAULTS).
  private conValoresIniciales(indicador: IndicadorSalida, initial: PivotsConfig): IndicadorSalida {
    const valoresPorEnum: Record<string, number> = {
      [PARAM.LONGITUD_VELAS]: initial.longitudVelas,
      [PARAM.SLIP_RATIO]: initial.slipRatioPct,
      [PARAM.LONGITUD_ATR]: initial.atrLength,
      [PARAM.ANIOS_HISTORICO]: initial.aniosHistorico,
      [PARAM.NUMERO_PIVOTES]: initial.numeroPivotes,
    };
    return {
      ...indicador,
      parametros: indicador.parametros.map(parametro => valoresPorEnum[parametro.enumParametro] === undefined
        ? parametro
        : { ...parametro, objValorSeleccionado: { ...parametro.objValorSeleccionado, valor: valoresPorEnum[parametro.enumParametro] } })
    };
  }

  // Los labels ya vienen traducidos desde el backend (ValidationMessages_*
  // .properties), pero son cortos y tecnicos -- "Numero de niveles por
  // lado" no dice nada sin mas contexto. El hint aparte, en frontend, es
  // mas facil de iterar que agregar una segunda columna de texto largo en
  // el backend Java.
  private static readonly HINT_KEYS: Record<string, string> = {
    [PARAM.LONGITUD_ATR]: 'ASSETS.PIVOTS_CONFIG_ATR_HINT',
    [PARAM.SLIP_RATIO]: 'ASSETS.PIVOTS_CONFIG_SLIP_HINT',
    [PARAM.LONGITUD_VELAS]: 'ASSETS.PIVOTS_CONFIG_VELAS_HINT',
    [PARAM.ANIOS_HISTORICO]: 'ASSETS.PIVOTS_CONFIG_ANIOS_HINT',
    [PARAM.NUMERO_PIVOTES]: 'ASSETS.PIVOTS_CONFIG_NUMERO_HINT',
  };

  hintKey(enumParametro: string): string {
    return PivotsConfigDialog.HINT_KEYS[enumParametro] ?? '';
  }

  onCalcular(): void {
    const indicador = this.indicador();
    if (!indicador) return;
    const valorDe = (enumParametro: string): number => {
      const valor = indicador.parametros.find(p => p.enumParametro === enumParametro)?.objValorSeleccionado;
      return (valor as ValorInteger | ValorFloat)?.valor ?? 0;
    };

    this.dialogRef.close({
      atrLength: valorDe(PARAM.LONGITUD_ATR),
      slipRatioPct: valorDe(PARAM.SLIP_RATIO),
      longitudVelas: valorDe(PARAM.LONGITUD_VELAS),
      aniosHistorico: valorDe(PARAM.ANIOS_HISTORICO),
      numeroPivotes: valorDe(PARAM.NUMERO_PIVOTES),
      priceReference: this.priceReference(),
      signalPrice: this.priceReference() === 'signal' ? this.data.signalPrice : undefined,
    } satisfies PivotsConfig);
  }
}
