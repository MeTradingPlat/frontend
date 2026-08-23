import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TranslatePipe } from '@ngx-translate/core';
import { ScannerFacadeService } from '../../../services/scanner-facade.service';
import { IndicadorSalida } from '../../../models/indicador-salida.interface';
import { ConditionalParameter } from '../card-selected-filters/conditional-parameter/conditional-parameter';
import { FloatParameter } from '../card-selected-filters/float-parameter/float-parameter';
import { IntegerParameter } from '../card-selected-filters/integer-parameter/integer-parameter';
import { OptionsParameter } from '../card-selected-filters/options-parameter/options-parameter';

/**
 * Vista previa de solo lectura del catalogo de indicadores de salida (stop
 * loss / take profit). Todavia no hay endpoint para asociar un indicador de
 * salida a un escaner -- este bloque solo confirma visualmente que el
 * catalogo/etiquetado/parametros configurables funcionan de punta a punta,
 * separado a proposito de la tarjeta de Filtros.
 */
@Component({
  selector: 'app-card-exit-indicators-preview',
  imports: [
    MatCardModule,
    TranslatePipe,
    ConditionalParameter,
    FloatParameter,
    IntegerParameter,
    OptionsParameter
  ],
  templateUrl: './card-exit-indicators-preview.html',
  styleUrl: './card-exit-indicators-preview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardExitIndicatorsPreview implements OnInit {
  private readonly facade = inject(ScannerFacadeService);

  readonly indicadores = signal<IndicadorSalida[]>([]);

  ngOnInit(): void {
    this.facade.loadIndicadoresSalidaSilent().subscribe({
      next: (catalogo) => {
        catalogo.forEach((indicador, index) => {
          this.facade.getIndicadorSalidaPorDefectoSilent(indicador.enumIndicadorSalida).subscribe({
            next: (conDefecto) => {
              this.indicadores.update(current => {
                const copia = [...current];
                copia[index] = conDefecto;
                return copia;
              });
            }
          });
        });
        this.indicadores.set(catalogo);
      },
      error: (err) => console.error('Error al cargar el catálogo de indicadores de salida:', err)
    });
  }
}
