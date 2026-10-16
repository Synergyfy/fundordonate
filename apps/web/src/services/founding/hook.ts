import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { foundingService } from "./index";
import type { JoinProgrammeInput } from "./type";

export const foundingKeys = {
  all: ["founding"] as const,
  programmes: (locationId: string) => [...foundingKeys.all, "programmes", locationId] as const,
  programme: (id: string) => [...foundingKeys.all, "programme", id] as const,
  myMemberships: () => [...foundingKeys.all, "my-memberships"] as const,
  members: (programmeId: string) => [...foundingKeys.all, "members", programmeId] as const,
  contributorProfile: (userId: string) => [...foundingKeys.all, "profile", userId] as const,
  originalStatus: (userId: string, locationId: string) =>
    [...foundingKeys.all, "original", userId, locationId] as const,
};

export function useFoundingProgrammes(locationId: string) {
  return useQuery({
    queryKey: foundingKeys.programmes(locationId),
    queryFn: () => foundingService.getProgrammes(locationId),
    enabled: !!locationId,
  });
}

export function useFoundingProgramme(programmeId?: string) {
  return useQuery({
    queryKey: foundingKeys.programme(programmeId || ""),
    queryFn: () => foundingService.getProgramme(programmeId!),
    enabled: !!programmeId,
  });
}

export function useMyFoundingMemberships() {
  return useQuery({
    queryKey: foundingKeys.myMemberships(),
    queryFn: () => foundingService.getMyMemberships(),
  });
}

export function useContributorProfile(userId?: string) {
  return useQuery({
    queryKey: foundingKeys.contributorProfile(userId || ""),
    queryFn: () => foundingService.getContributorProfile(userId!),
    enabled: !!userId,
  });
}

export function useJoinFoundingProgramme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: JoinProgrammeInput) => foundingService.joinProgramme(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foundingKeys.all });
    },
  });
}
