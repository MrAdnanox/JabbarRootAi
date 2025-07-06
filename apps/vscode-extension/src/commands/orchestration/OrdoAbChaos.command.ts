import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../../core/interfaces';
import { OrdoAbChaosOrchestrator } from '@jabbarroot/prompt-factory';
import { NotificationService } from '../../services/ui/notification.service';

export class OrdoAbChaosCommand implements ICommandModule {
    public readonly metadata = {
        id: 'jabbarroot.orchestration.OrdoAbChaos',
        title: 'JabbarRoot: Ordo Ab Chaos (Test)',
        category: 'jabbarroot' as const,
    };

    public readonly dependencies = [
        'ordoAbChaosOrchestrator',
        'notificationService'
    ] as const;

    public async execute(services: Map<keyof ServiceCollection, IService>): Promise<void> {
        const orchestrator = services.get('ordoAbChaosOrchestrator') as OrdoAbChaosOrchestrator;
        const notificationService = services.get('notificationService') as NotificationService;

        notificationService.showInfo('Lancement du test de l\'orchestrateur Ordo Ab Chaos...');

        try {
            // Tâche de test minimale : ne pas lancer une analyse complète
            // On va juste vérifier que l'orchestrateur est bien instancié et peut être appelé.
            const result = await orchestrator.runSmokeTest(); // Méthode à ajouter à l'orchestrateur

            notificationService.showInfo(`Test de l'orchestrateur réussi ! Résultat : ${result}`);
        } catch (error) {
            notificationService.showError("Le test de l'orchestrateur a échoué", error);
        }
    }
}

export default new OrdoAbChaosCommand();