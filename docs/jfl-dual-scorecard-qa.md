# JFL dual-team scorecard QA

This flow is available only on `jfl.fremontderby.com` to let one human tester exercise both sides of the same live scoring contract without sharing a production identity.

## Phone test flow

1. Sign in to JFL normally and open **Profile**.
2. In **Test Persona**, choose **Admin Captain**. The yellow banner must read `TEST PERSONA · JFL · Admin Captain`.
3. Open **Score**. This persona is a JFL QA member of **JFL QA Bank Shots** and can enter, edit, undo, and confirm only the Bank Shots side of the current QA matchup.
4. Return to **Profile** and choose **Regular Captain**. The yellow banner must now read `TEST PERSONA · JFL · Regular Captain`.
5. Open **Score** again. This persona is a JFL QA member of **JFL QA Table Testers** and can enter, edit, undo, and confirm only the Table Testers side.
6. Switch between the two personas to validate aligned histories, mismatches, corrections after confirmation, race completion, and finalization.
7. To start over, open **Profile** and press **Reset dual-team scorecard test**. The reset clears both sides' rack submissions and canonical score state for the JFL QA Bank Shots vs JFL QA Table Testers matchup while preserving its lineups.
8. Choose **Real signed-in user** when finished to leave persona mode.

## Safety boundary

The reset route and database RPC are JFL-only. The browser route requires an explicit signed-in test-persona operator, and the database reset RPC is executable only by the service role. Gamma, DRU, and production do not expose this reset path.
