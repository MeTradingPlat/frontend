import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { I18nRefreshDirective } from '../../../../../shared/directives/i18n-refresh.directive';
import { ScannerFacadeService } from '../../../../scanner/services/scanner-facade.service';
import { IndicadorSalida } from '../../../../scanner/models/indicador-salida.interface';
import { ValorInteger } from '../../../../scanner/models/valor-integer.interface';
import { ValorFloat } from '../../../../scanner/models/valor-float.interface';
import { IntegerParameter } from '../../../../scanner/components/scanner-configuration/card-selected-filters/integer-parameter/integer-parameter';
import { FloatParameter } from '../../../../scanner/components/scanner-configuration/card-selected-filters/float-parameter/float-parameter';
import { OptionsParameter } from '../../../../scanner/components/scanner-configuration/card-selected-filters/options-parameter/options-parameter';
import { PivotsConfig } from '../../../models/pivots.models';

// Reusa el catalogo de "indicador de salida" Pivots que scanner ya expone
// (mismos parametros, defaults y validacion de rango que
// IndicadorSalidaFactoryPivots.java) en vez de duplicar un formulario
// nuevo -- esta ventana solo lo muestra suelto, sin persistirlo a ningun
// escaner.
const ENUM_INDICADOR_PIVOTS = 'PIVOTS';
const PARAM = {
  LONGITUD_VELAS: 'LONGITUD_VELAS_PIVOTS_SALIDA',
  SLIP_RATIO: 'SLIP_RATIO_PIVOTS_SALIDA',
  LONGITUD_ATR: 'LONGITUD_ATR_PIVOTS_SALIDA',
  ANIOS_HISTORICO: 'ANIOS_HISTORICO_PIVOTS_SALIDA',
  NUMERO_PIVOTES: 'NUMERO_PIVOTES_PIVOTS_SALIDA',
} as const;

@Component({
  selector: 'app-pivots-config-dialog',
  imports: [
    MatDialogModule, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    TranslateModule, I18nRefreshDirective, IntegerParameter, FloatParameter, OptionsParameter
  ],
  templateUrl: './pivots-config-dialog.html',
  styleUrl: './pivots-config-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PivotsConfigDialog implements OnInit {
  readonly dialogRef = inject(MatDialogRef<PivotsConfigDialog>);
  readonly data: { initial?: PivotsConfig } = inject(MAT_DIALOG_DATA, { optional: true }) || {};
  private readonly facade = inject(ScannerFacadeService);

  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly indicador = signal<IndicadorSalida | null>(null);

  ngOnInit(): void {
    this.facade.getIndicadorSalidaPorDefectoSilent(ENUM_INDICADOR_PIVOTS).subscribe({
      next: (indicador) => {
        this.indicador.set(this.data.initial ? this.conValoresIniciales(indicador, this.data.initial) : indicador);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      }
    });
  }

  // Reabrir la ventana ya con lo que la persona eligio la vez anterior
  // (en vez de siempre resetear a los defaults del backend) -- ver
  // openPivotsConfig en symbol-chart.component.ts.
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
    } satisfies PivotsConfig);
  }
}
